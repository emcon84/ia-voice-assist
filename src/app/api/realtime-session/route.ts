import { NextResponse } from "next/server";
import { getActiveAssistant, buildFullPrompt } from "@/assistants/registry";

export const runtime = "nodejs";

export async function POST() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OPENAI_API_KEY not set" }, { status: 500 });
  }

  const assistant = getActiveAssistant();

  const response = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      session: {
        type: "realtime",
        model: assistant.models.realtime,
        instructions: buildFullPrompt(assistant),
        audio: {
          output: {
            voice: assistant.voice.realtimeVoice,
          },
        },
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("OpenAI Realtime session error:", error);
    return NextResponse.json({ error }, { status: 500 });
  }

  const data = await response.json();
  return NextResponse.json({ token: data.value });
}
