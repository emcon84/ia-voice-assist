import { processMessage, type ChatMessage } from "@/services/chatService";
import { getAssistantById, getActiveAssistant } from "@/assistants/registry";
import { sendTextMessage, sendListMessage } from "@/services/kapsoService";
import crypto from "crypto";

// ⚠️ Almacenamiento en memoria: se pierde con cold starts de Vercel.
// Para producción, migrar a Vercel KV, Redis o DB.
const conversationHistory = new Map<string, ChatMessage[]>();
const MAX_HISTORY = 50; // mensajes máximos por conversación

async function getAssistant(): Promise<{ assistant: NonNullable<ReturnType<typeof getAssistantById>>; convId?: string }> {
  const assistantId = process.env.NEXT_PUBLIC_ASSISTANT_ID || "demo";
  const assistant = getAssistantById(assistantId) || getActiveAssistant();
  if (!assistant) {
    console.error("[whatsapp] No assistant found for:", assistantId);
    throw new Error("No assistant configured");
  }
  return { assistant };
}

/**
 * Determina el texto del mensaje del usuario según el tipo.
 * - text → text.body
 * - interactive.list_reply → list_reply.title (lo que tocó el usuario)
 * - otro → kapso.content como fallback
 */
function extractUserText(message: Record<string, unknown>): string | null {
  if (message.type === "text") {
    const text = message.text as Record<string, unknown> | undefined;
    return text?.body as string ?? (message.kapso as Record<string, unknown>)?.content as string ?? null;
  }
  if (message.type === "interactive") {
    const interactive = message.interactive as Record<string, unknown> | undefined;
    if (interactive?.type === "list_reply") {
      const reply = interactive.list_reply as Record<string, unknown> | undefined;
      return reply?.title as string ?? null;
    }
    if (interactive?.type === "button_reply") {
      const reply = interactive.button_reply as Record<string, unknown> | undefined;
      return reply?.title as string ?? null;
    }
  }
  return (message.kapso as Record<string, unknown>)?.content as string ?? null;
}

export async function POST(req: Request) {
  // 1. Verify webhook signature
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

  // 2. Parse event
  const event = req.headers.get("x-webhook-event");
  const payload = await req.json();

  // 3. Only process inbound messages
  if (event !== "whatsapp.message.received") {
    return new Response("OK", { status: 200 });
  }

  // 4. Extract message data
  const message = payload.message;
  const conversation = payload.conversation;
  const phoneNumberId = payload.phone_number_id;

  if (!message || message.kapso.direction !== "inbound") {
    return new Response("OK", { status: 200 });
  }

  // Extract user text from any message type (text, interactive list_reply, etc.)
  const text = extractUserText(message);
  const from = message.from;

  if (!text || !from) {
    return new Response("OK", { status: 200 });
  }

  // 5. Determine assistant
  let assistant: ReturnType<typeof getAssistantById>;
  try {
    const result = await getAssistant();
    assistant = result.assistant;
  } catch {
    return new Response("OK", { status: 200 });
  }

  const convId = conversation?.id;

  // 6. ⭐ NEW CONVERSATION → send welcome list instead of AI reply
  if (payload.is_new_conversation && assistant.whatsapp?.welcomeMessage) {
    const wm = assistant.whatsapp.welcomeMessage;
    try {
      await sendListMessage(
        phoneNumberId,
        from,
        wm.body,
        wm.buttonText,
        wm.sections,
        wm.footer
      );
      // Store the welcome as initial history so the AI knows context
      if (convId) {
        conversationHistory.set(convId, [
          { role: "assistant", content: wm.body },
        ]);
      }
    } catch (err) {
      console.error("[whatsapp] Error sending welcome list:", err);
    }
    return new Response("OK", { status: 200 });
  }

  // 7. Recover conversation history
  const history = convId ? conversationHistory.get(convId) || [] : [];
  const messages: ChatMessage[] = [
    ...history,
    { role: "user", content: text },
  ];

  try {
    // 8. Process message with full history
    const result = await processMessage(assistant, text, {
      messages,
      conversationId: convId,
    });

    // 9. Store updated history
    if (convId) {
      const updated = [...messages, { role: "assistant" as const, content: result.reply }];
      conversationHistory.set(convId, updated.slice(-MAX_HISTORY));
    }

    // 10. Send reply via Kapso
    await sendTextMessage(phoneNumberId, from, result.reply);
  } catch (err: any) {
    console.error("[whatsapp] Error processing message:", err);
  }

  // 11. Always return 200 to Kapso
  return new Response("OK", { status: 200 });
}
