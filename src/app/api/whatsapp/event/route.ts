import { processMessage } from "@/services/chatService";
import { getAssistantById, getActiveAssistant } from "@/assistants/registry";
import { sendTextMessage } from "@/services/kapsoService";
import crypto from "crypto";

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

  try {
    // 6. Process message through the assistant
    const result = await processMessage(assistant, text, {
      conversationId: conversation?.id,
    });

    // 7. Send reply via Kapso
    await sendTextMessage(phoneNumberId, from, result.reply);
  } catch (err: any) {
    console.error("[whatsapp] Error processing message:", err);
    // Don't fail the webhook - Kapso will retry
  }

  // 8. Always return 200 to Kapso
  return new Response("OK", { status: 200 });
}
