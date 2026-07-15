import { NextResponse } from "next/server";
import { buildFullOmarPrompt } from "@/data/knowledge";

export const runtime = "nodejs";

export async function POST() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OPENAI_API_KEY not set" }, { status: 500 });
  }

  const response = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      session: {
        type: "realtime",
        model: "gpt-4o-realtime-preview-2024-12-17",
        instructions: buildFullOmarPrompt(),
        audio: {
          output: {
            voice: "echo",
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
