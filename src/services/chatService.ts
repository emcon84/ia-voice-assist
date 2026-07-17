import type { AssistantConfig } from "@/assistants/_contract";
import { buildDynamicPrompt, buildOnboardingPrompt, getLoadedModuleIds } from "@/assistants/registry";
import Anthropic from "@anthropic-ai/sdk";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ProcessMessageOptions {
  messages?: ChatMessage[];
  projectId?: string;
  conversationId?: string;
  mode?: "chat" | "onboarding";
  projectContext?: string;
}

export interface ProcessMessageResult {
  reply: string;
  conversationId?: string;
}

export class NoCreditsError extends Error {
  service: string;
  constructor(service: string, message: string) {
    super(message);
    this.name = "NoCreditsError";
    this.service = service;
  }
}

export async function processMessage(
  assistant: AssistantConfig,
  userText: string,
  options: ProcessMessageOptions = {}
): Promise<ProcessMessageResult> {
  const { projectId, conversationId, mode = "chat", messages = [], projectContext } = options;

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicKey) throw new Error("ANTHROPIC_API_KEY not set");

  const anthropic = new Anthropic({ apiKey: anthropicKey });

  // Build system prompt
  let systemPrompt: string;
  let extraTokens = 0;

  if (projectId && projectContext) {
    systemPrompt = buildDynamicPrompt(assistant, userText, projectContext);
  } else {
    systemPrompt = buildDynamicPrompt(assistant, userText);
  }

  // DataProvider injection
  if (assistant.dataProvider && mode !== "onboarding") {
    try {
      const data = await assistant.dataProvider.fetchData(userText);
      systemPrompt += `\n\n---\n\nDATOS ACTUALIZADOS:\n${data}`;
      extraTokens = 150;
    } catch (err) {
      console.error(`[chatService] dataProvider error for ${assistant.id}:`, err);
    }
  }

  // Log loaded modules in dev
  if (process.env.NODE_ENV !== "production") {
    const loaded = getLoadedModuleIds(assistant, userText);
    console.log(`[chatService] ${assistant.id} modules:`, loaded);
    console.log(`[chatService] estimated tokens:`, Math.round(systemPrompt.length / 4));
  }

  // Build messages array for the API call
  const apiMessages: Anthropic.MessageParam[] =
    messages.length > 0
      ? messages.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        }))
      : [{ role: "user" as const, content: userText }];

  // Determine max tokens
  let maxTokens = 350;
  if (mode === "onboarding") maxTokens = 500;
  else if (extraTokens > 0) maxTokens = Math.max(500, extraTokens + 200);

  try {
    const response = await anthropic.messages.create({
      model: assistant.models.chat,
      max_tokens: maxTokens,
      system: [
        {
          type: "text",
          text: systemPrompt,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: apiMessages,
    });

    // Extract text from response
    let reply = "";
    for (const block of response.content) {
      if (block.type === "text") reply += block.text;
    }

    return { reply, conversationId };
  } catch (err: any) {
    // Handle Anthropic errors
    if (err.status === 402 || err.status === 529 ||
        err.message?.includes?.("credit_balance_too_low") ||
        err.message?.includes?.("credit")) {
      throw new NoCreditsError("anthropic", err.message || "No credits");
    }
    throw err;
  }
}
