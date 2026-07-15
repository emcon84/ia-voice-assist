import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audio = formData.get("audio") as File;

    if (!audio) {
      return NextResponse.json({ error: "No audio provided" }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GROQ_API_KEY not set" }, { status: 500 });
    }

    const whisperForm = new FormData();
    const ext = audio.type.includes("mp4") ? "mp4" : audio.type.includes("ogg") ? "ogg" : "webm";
    whisperForm.append("file", audio, `audio.${ext}`);
    whisperForm.append("model", "whisper-large-v3-turbo");
    whisperForm.append("language", "es");
    whisperForm.append("response_format", "json");

    const response = await fetch(
      "https://api.groq.com/openai/v1/audio/transcriptions",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}` },
        body: whisperForm,
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("Whisper STT error:", response.status, error);
      return NextResponse.json({ error }, { status: 500 });
    }

    const result = await response.json();
    return NextResponse.json({ transcript: result.text });
  } catch (error) {
    console.error("STT error:", error);
    return NextResponse.json({ error: "STT failed" }, { status: 500 });
  }
}
