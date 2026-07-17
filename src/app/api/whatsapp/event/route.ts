import { processMessage, type ChatMessage } from "@/services/chatService";
import { getAssistantById, getActiveAssistant } from "@/assistants/registry";
import type { WhatsAppConfig } from "@/assistants/_contract";
import { sendTextMessage, sendListMessage } from "@/services/kapsoService";
import * as questionnaire from "@/services/questionnaireService";
import crypto from "crypto";

// ⚠️ Almacenamiento en memoria: se pierde con cold starts de Vercel.
// Para producción, migrar a Vercel KV, Redis o DB.
const conversationHistory = new Map<string, ChatMessage[]>();
const MAX_HISTORY = 50;

async function getAssistant(): Promise<ReturnType<typeof getAssistantById>> {
  const assistantId = process.env.NEXT_PUBLIC_ASSISTANT_ID || "demo";
  return getAssistantById(assistantId) || getActiveAssistant();
}

/**
 * Extrae el texto del mensaje del usuario según el tipo.
 * - text → text.body
 * - interactive.list_reply → list_reply.title (lo que tocó)
 * - interactive.button_reply → button_reply.title
 * - otro → kapso.content
 */
function extractUserText(message: Record<string, unknown>): string | null {
  if (message.type === "text") {
    const text = message.text as Record<string, unknown> | undefined;
    return text?.body as string ?? (message.kapso as Record<string, unknown>)?.content as string ?? null;
  }
  if (message.type === "interactive") {
    const interactive = message.interactive as Record<string, unknown> | undefined;
    if (interactive?.type === "list_reply") {
      return (interactive.list_reply as Record<string, unknown> | undefined)?.title as string ?? null;
    }
    if (interactive?.type === "button_reply") {
      return (interactive.button_reply as Record<string, unknown> | undefined)?.title as string ?? null;
    }
  }
  return (message.kapso as Record<string, unknown>)?.content as string ?? null;
}

/**
 * Obtiene el flowId desde un interactive reply del menú de bienvenida.
 * Busca en las secciones del welcomeMessage el id que coincide.
 */
function getFlowIdFromReply(
  replyId: string,
  welcomeMessage: WhatsAppConfig["welcomeMessage"]
): string | null {
  for (const section of welcomeMessage.sections) {
    for (const row of section.rows) {
      if (row.id === replyId) return replyId;
    }
  }
  return null;
}

export async function POST(req: Request) {
  // ── 1. Verify webhook signature ─────────────────────────────────────────────
  const signature = req.headers.get("x-webhook-signature");
  const secret = process.env.KAPSO_WEBHOOK_SECRET;

  if (secret && signature) {
    const body = await req.clone().text();
    const expected = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("hex");

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
      return new Response("Invalid signature", { status: 401 });
    }
  }

  // ── 2. Parse event ─────────────────────────────────────────────────────────
  const event = req.headers.get("x-webhook-event");
  const payload = await req.json();

  if (event !== "whatsapp.message.received") {
    return new Response("OK", { status: 200 });
  }

  // ── 3. Extract message data ────────────────────────────────────────────────
  const message = payload.message;
  const conversation = payload.conversation;
  const phoneNumberId = payload.phone_number_id;

  if (!message || message.kapso.direction !== "inbound") {
    return new Response("OK", { status: 200 });
  }

  const text = extractUserText(message);
  const from = message.from;
  if (!text || !from) {
    return new Response("OK", { status: 200 });
  }

  // ── 4. Determine assistant ─────────────────────────────────────────────────
  const assistant = await getAssistant();
  if (!assistant) {
    console.error("[whatsapp] No assistant found");
    return new Response("OK", { status: 200 });
  }

  const convId = conversation?.id || `conv_${from}`;

  // ── 5. NEW CONVERSATION → send welcome list (no AI, no questionnaire) ──────
  if (payload.is_new_conversation && assistant.whatsapp?.welcomeMessage) {
    const wm = assistant.whatsapp.welcomeMessage;
    try {
      await sendListMessage(phoneNumberId, from, wm.body, wm.buttonText, wm.sections, wm.footer);
    } catch (err) {
      console.error("[whatsapp] Error sending welcome list:", err);
    }
    return new Response("OK", { status: 200 });
  }

  // ── 6. ACTIVE QUESTIONNAIRE → process answer, send next or complete ────────
  const activeSession = questionnaire.getSession(convId);
  if (activeSession) {
    const result = questionnaire.processAnswer(convId, text);

    if (result.done) {
      // All questions answered → compile and call AI
      const compiledInfo = questionnaire.compileAnswers(activeSession.flowId, result.answers);
      const history = conversationHistory.get(convId) || [];
      const messages: ChatMessage[] = [
        ...history,
        {
          role: "user" as const,
          content: `[DATOS_ENCUESTA]\n${compiledInfo}\n[/DATOS_ENCUESTA]\n\nAyudame con esto:`,
        },
      ];

      try {
        const aiResult = await processMessage(assistant, compiledInfo, {
          messages,
          conversationId: convId,
        });
        if (convId) {
          const updated = [
            ...messages,
            { role: "assistant" as const, content: aiResult.reply },
          ];
          conversationHistory.set(convId, updated.slice(-MAX_HISTORY));
        }
        await sendTextMessage(phoneNumberId, from, aiResult.reply);
      } catch (err) {
        console.error("[whatsapp] AI error after questionnaire:", err);
      }
    } else {
      // Send next question
      await sendQuestionStep(phoneNumberId, from, result.step);
    }
    return new Response("OK", { status: 200 });
  }

  // ── 7. INTERACTIVE REPLY (welcome menu tap) → start questionnaire ──────────
  if (message.type === "interactive" && assistant.whatsapp?.welcomeMessage) {
    const interactive = message.interactive as Record<string, unknown> | undefined;
    const replyType = interactive?.type;
    const reply =
      replyType === "list_reply"
        ? (interactive?.list_reply as Record<string, unknown> | undefined)
        : replyType === "button_reply"
          ? (interactive?.button_reply as Record<string, unknown> | undefined)
          : null;

    const replyId = (reply?.id as string) || "";
    const flowId = getFlowIdFromReply(replyId, assistant.whatsapp.welcomeMessage);

    if (flowId && questionnaire.isValidFlow(flowId)) {
      questionnaire.startSession(convId, flowId);
      const firstStep = questionnaire.getFirstStep(flowId);
      if (firstStep) {
        await sendQuestionStep(phoneNumberId, from, firstStep);
      }
    } else {
      // Unknown interactive reply → fallback to AI
      await processAndReply(assistant, phoneNumberId, from, convId, text);
    }
    return new Response("OK", { status: 200 });
  }

  // ── 8. DEFAULT: normal AI chat ─────────────────────────────────────────────
  await processAndReply(assistant, phoneNumberId, from, convId, text);
  return new Response("OK", { status: 200 });
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

async function sendQuestionStep(
  phoneNumberId: string,
  to: string,
  step: questionnaire.QuestionStep
): Promise<void> {
  if (step.type === "list" && step.options && step.buttonText) {
    await sendListMessage(phoneNumberId, to, step.question, step.buttonText, [
      { title: "Opciones", rows: step.options },
    ]);
  } else {
    await sendTextMessage(phoneNumberId, to, step.question);
  }
}

async function processAndReply(
  assistant: NonNullable<ReturnType<typeof getAssistantById>>,
  phoneNumberId: string,
  to: string,
  convId: string,
  text: string
): Promise<void> {
  const history = convId ? conversationHistory.get(convId) || [] : [];
  const messages: ChatMessage[] = [...history, { role: "user", content: text }];

  try {
    const result = await processMessage(assistant, text, {
      messages,
      conversationId: convId,
    });

    if (convId) {
      const updated = [
        ...messages,
        { role: "assistant" as const, content: result.reply },
      ];
      conversationHistory.set(convId, updated.slice(-MAX_HISTORY));
    }

    await sendTextMessage(phoneNumberId, to, result.reply);
  } catch (err) {
    console.error("[whatsapp] processAndReply error:", err);
  }
}
