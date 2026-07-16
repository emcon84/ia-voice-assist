import { NextRequest, NextResponse } from "next/server";
import {
  getActiveAssistant,
  buildDynamicPrompt,
  buildOnboardingPrompt,
  getLoadedModuleIds,
} from "@/assistants/registry";
import { webSearchService } from "@/services/webSearchService";
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

    const assistant = getActiveAssistant();
    const userText = messages.map((m) => m.content).join(" ");

    let systemPrompt: string;
    let maxTokens = 350;

    if (projectId) {
      // prisma es lazy: no exige DATABASE_URL salvo que realmente se use (con projectId).
      const project = await prisma.project.findUnique({ where: { id: projectId } });
      if (mode === "onboarding") {
        systemPrompt = buildOnboardingPrompt(assistant, project?.name ?? "tu caso");
        maxTokens = 500;
      } else {
        systemPrompt = buildDynamicPrompt(assistant, userText, project?.context ?? undefined);
      }
    } else {
      systemPrompt = buildDynamicPrompt(assistant, userText);
    }

    // --- BÚSQUEDA WEB INTELIGENTE ---
    // Detecta consultas MUY específicas (listados, precios, disponibilidad, datos
    // actualizados de productos/servicios) y busca en la web para dar información real.
    // Es genérica para cualquier negocio: no está atada a un sitio en particular.
    let webResults = "";

    if (
      mode !== "onboarding" &&
      webSearchService.shouldSearchWebSpecific(userText)
    ) {
      try {
        const results = await webSearchService.searchWeb(userText);
        if (results.length > 0) {
          webResults = webSearchService.formatResultsForPrompt(results);
          systemPrompt += `\n\n---\n\nINFORMACIÓN ENCONTRADA EN LA WEB PARA RESPONDER LA CONSULTA DEL USUARIO:\n${webResults}\n\nIMPORTANTE: Usá esta información cuando sea relevante para la consulta. Si encontrás datos útiles, compartí los links directamente. Si los resultados no responden la consulta exacta, ignorá esta sección y respondé con tu criterio normal.`;
          maxTokens = Math.max(maxTokens, 500);
        }
      } catch (err) {
        console.error("Web search error:", err);
        // Si falla la búsqueda, sigue sin resultados — no bloquea la respuesta.
      }
    }
    // --- FIN BÚSQUEDA WEB ---

    // Log en dev para ver qué módulos se cargaron
    if (process.env.NODE_ENV === "development") {
      const loaded = getLoadedModuleIds(assistant, userText);
      console.log(`[${assistant.identity.name}] Módulos cargados: ${loaded.join(", ") || "solo base"} | Tokens estimados: ~${Math.round(systemPrompt.length / 4)} | Web results: ${webResults ? "Sí" : "No"}`);
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
        model: assistant.models.chat,
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
    const hasWebResults = !!webResults;

    return NextResponse.json({ reply, conversationId, hasWebResults });
  } catch (error) {
    console.error("OMAR chat error:", error);
    return NextResponse.json({ error: "Chat failed" }, { status: 500 });
  }
}
