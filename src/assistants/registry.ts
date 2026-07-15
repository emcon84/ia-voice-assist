// REGISTRY de asistentes: el único lugar que conoce todas las marcas.
//
// El resto del código pide getActiveAssistant() y trabaja contra el contrato.
// Para cambiar de asistente (Lucas -> Omar -> el próximo cliente) se cambia UNA
// variable de entorno: NEXT_PUBLIC_ASSISTANT_ID. Nada de forks del proyecto.

import type { AssistantConfig } from "./_contract";
import { demoConfig } from "./demo";

/**
 * Todas las configs registradas. Migrar Omar/Max a este mapa reemplazando sus
 * datos hardcodeados por una AssistantConfig.
 */
const ASSISTANTS: Record<string, AssistantConfig> = {
  demo: demoConfig,
};

const DEFAULT_ASSISTANT_ID = "demo";

/** Devuelve la config del asistente activo según el entorno. */
export function getActiveAssistant(): AssistantConfig {
  const id = process.env.NEXT_PUBLIC_ASSISTANT_ID ?? DEFAULT_ASSISTANT_ID;
  const config = ASSISTANTS[id];
  if (!config) {
    console.warn(
      `[registry] Asistente "${id}" no registrado. Usando "${DEFAULT_ASSISTANT_ID}".`
    );
    return ASSISTANTS[DEFAULT_ASSISTANT_ID];
  }
  return config;
}

/** Minúsculas + sin tildes, para matchear keywords sin depender de acentos. */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

/**
 * Selecciona los módulos de conocimiento relevantes para un texto, según keywords
 * y codePatterns. Reemplaza la lógica hardcodeada de knowledge-router.
 */
export function selectModules(config: AssistantConfig, text: string): string[] {
  const norm = normalize(text);
  return config.knowledge.modules
    .filter((mod) => {
      const byKeyword = mod.keywords.some((kw) => norm.includes(normalize(kw)));
      const byPattern = mod.codePatterns?.some((rx) => rx.test(norm)) ?? false;
      return byKeyword || byPattern;
    })
    .map((mod) => mod.content);
}

/**
 * Arma el prompt dinámico: persona base + módulos relevantes al mensaje +
 * contexto opcional (ej. perfil de obra/cliente). Genérico para cualquier marca.
 */
export function buildDynamicPrompt(
  config: AssistantConfig,
  userText: string,
  extraContext?: string
): string {
  const parts = [config.persona.basePrompt, ...selectModules(config, userText)];
  if (extraContext) {
    parts.push(`CONTEXTO DEL USUARIO:\n${extraContext}`);
  }
  return parts.join("\n\n---\n\n");
}

/**
 * Arma el prompt de onboarding (entrevista estructurada). Si el asistente no tiene
 * onboarding configurado, degrada a la persona base (chat normal).
 */
export function buildOnboardingPrompt(config: AssistantConfig, subject: string): string {
  const ob = config.knowledge.onboarding;
  if (!ob) return config.persona.basePrompt;

  const questions = ob.questions.map((q, i) => `${i + 1}. ${q}`).join("\n");
  return [
    config.persona.basePrompt,
    `ENTREVISTA DE ONBOARDING sobre "${subject}". Hacé estas preguntas UNA POR UNA, esperando la respuesta de cada una antes de la siguiente:\n${questions}`,
    ob.closingInstruction,
  ].join("\n\n---\n\n");
}

/** IDs de los módulos que matchean un texto (para logging en dev). */
export function getLoadedModuleIds(config: AssistantConfig, text: string): string[] {
  const norm = normalize(text);
  return config.knowledge.modules
    .filter((mod) => {
      const byKeyword = mod.keywords.some((kw) => norm.includes(normalize(kw)));
      const byPattern = mod.codePatterns?.some((rx) => rx.test(norm)) ?? false;
      return byKeyword || byPattern;
    })
    .map((mod) => mod.id);
}
