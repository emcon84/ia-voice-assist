import { NextRequest, NextResponse } from "next/server";
import { buildDynamicPrompt, getLoadedModules } from "@/lib/knowledge-router";
import { buildOnboardingPrompt } from "@/data/knowledge";
import prisma from "@/infrastructure/database/prisma";

export const runtime = "nodejs";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface MaxChatRequest {
  messages: Message[];
  projectId?: string;
  conversationId?: string;
  mode?: "chat" | "onboarding";
}

export async function POST(req: NextRequest) {
  try {
    const { messages, projectId, conversationId, mode } = await req.json() as MaxChatRequest;

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY not set" }, { status: 500 });
    }

    let systemPrompt: string;
    let maxTokens = 350;

    if (mode === "onboarding" && projectId) {
      const project = await prisma.project.findUnique({ where: { id: projectId } });
      systemPrompt = buildOnboardingPrompt(project?.name ?? "obra");
      maxTokens = 500;
    } else if (projectId) {
      const project = await prisma.project.findUnique({ where: { id: projectId } });
      systemPrompt = buildDynamicPrompt(messages, project?.context ?? undefined);
    } else {
      systemPrompt = buildDynamicPrompt(messages);
    }

    // Log en dev para ver qué módulos se cargaron
    if (process.env.NODE_ENV === "development") {
      const loaded = getLoadedModules(messages);
      console.log(`[OMAR] Módulos cargados: ${loaded.join(", ")} | Tokens estimados: ~${Math.round(systemPrompt.length / 4)}`);
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-beta": "prompt-caching-2024-07-31",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: maxTokens,
        system: [{ type: "text", text: systemPrompt, cache_control: { type: "ephemeral" } }],
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Claude error:", response.status, errorText);
      if (response.status === 402 || response.status === 529 ||
          errorText.includes("credit_balance_too_low") || errorText.includes("credit")) {
        return NextResponse.json({ error: "NO_CREDITS", service: "anthropic" }, { status: 402 });
      }
      return NextResponse.json({ error: errorText }, { status: 500 });
    }

    const data = await response.json();
    const reply = data.content[0]?.text ?? "";

    // Demo sin login: no se persiste en DB, el historial vive en el navegador.
    return NextResponse.json({ reply, conversationId });
  } catch (error) {
    console.error("OMAR chat error:", error);
    return NextResponse.json({ error: "Chat failed" }, { status: 500 });
  }
}
