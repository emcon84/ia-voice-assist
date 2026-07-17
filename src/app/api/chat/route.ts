import { processMessage, NoCreditsError } from "@/services/chatService";
import { getActiveAssistant } from "@/assistants/registry";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages, projectId, conversationId, mode, projectContext } = body;

    const userText = messages?.find((m: any) => m.role === "user")?.content || "";
    const assistant = getActiveAssistant();

    const result = await processMessage(assistant, userText, {
      messages,
      projectId,
      conversationId,
      mode,
      projectContext,
    });

    return Response.json({ reply: result.reply, conversationId: result.conversationId });
  } catch (err: any) {
    if (err instanceof NoCreditsError) {
      return Response.json(
        { error: "NO_CREDITS", service: err.service },
        { status: 402 }
      );
    }
    console.error("[chat] Error:", err);
    return Response.json({ error: err.message || "Chat failed" }, { status: 500 });
  }
}
