import { processMessage, type ChatMessage } from "@/services/chatService";
import { getAssistantById, getActiveAssistant } from "@/assistants/registry";
import { sendTextMessage } from "@/services/kapsoService";
import crypto from "crypto";

// ⚠️ Almacenamiento en memoria: se pierde con cold starts de Vercel.
// Para producción, migrar a Vercel KV, Redis o DB.
const conversationHistory = new Map<string, ChatMessage[]>();
const MAX_HISTORY = 50; // mensajes máximos por conversación

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

  // Only handle text messages for now
  const text = message.type === "text" ? message.text?.body || message.kapso.content : message.kapso.content;
  const from = message.from;

  if (!text || !from) {
    return new Response("OK", { status: 200 });
  }

  // 5. Determine assistant - for demo we use env var
  // In production, map phone_number_id → assistant_id
  const assistantId = process.env.NEXT_PUBLIC_ASSISTANT_ID || "demo";
  const assistant = getAssistantById(assistantId) || getActiveAssistant();

  if (!assistant) {
    console.error("[whatsapp] No assistant found for:", assistantId);
    return new Response("OK", { status: 200 });
  }

  // 6. Recover conversation history
  const convId = conversation?.id;
  const history = convId ? conversationHistory.get(convId) || [] : [];
  const messages: ChatMessage[] = [
    ...history,
    { role: "user", content: text },
  ];

  try {
    // 7. Process message with full history
    const result = await processMessage(assistant, text, {
      messages,
      conversationId: convId,
    });

    // 8. Store updated history
    if (convId) {
      const updated = [...messages, { role: "assistant" as const, content: result.reply }];
      // Trim to avoid unbounded growth
      conversationHistory.set(convId, updated.slice(-MAX_HISTORY));
    }

    // 9. Send reply via Kapso
    await sendTextMessage(phoneNumberId, from, result.reply);
  } catch (err: any) {
    console.error("[whatsapp] Error processing message:", err);
    // Don't fail the webhook - Kapso will retry
  }

  // 10. Always return 200 to Kapso
  return new Response("OK", { status: 200 });
}
