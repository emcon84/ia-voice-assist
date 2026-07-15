// Router de conocimiento de Omar.
// Siempre carga la base (identidad + directorio de la cooperativa) y agrega los
// módulos profundos SOLO cuando la intención de la charla lo amerita. Así el
// prompt queda enfocado y barato, y Omar profundiza cuando hace falta.

import { OMAR_BASE, CONCRETE_MODULE, CORRALON_MODULE } from "@/data/knowledge";

export type KnowledgeModule = "base" | "concrete" | "corralon";

type Msg = { role: string; content: string };

// Palabras clave que disparan el cerebro de HORMIGÓN.
const CONCRETE_KEYWORDS = [
  "hormigon", "cirsoc", "losa", "columna", "viga", "platea", "mixer",
  "slump", "asentamiento", "sulfato", "sulforresistente", "autonivelante",
  "probeta", "bombeable", "encofrado", "curado", "desencofrar", "fragua",
  "fragüe", "frague", "dosificacion", "vibrado", "mpa", "metros cubicos",
  "metro cubico", "estructural", "hormigonar",
];

// Palabras clave que disparan el cerebro de CORRALÓN / MATERIALES.
const CORRALON_KEYWORDS = [
  "ladrillo", "bloque", "ferreteria", "corralon", "pintura", "plavicon",
  "latex", "esmalte", "membrana", "revoque", "mamposteria", "arena", "cal",
  "abertura", "herramienta", "tejido", "alambre", "molino", "bulon",
  "herraje", "chapa", "hierro", "varilla", "cascote", "balde", "rodillo",
  "sanitario", "griferia", "cemento", "contrapiso", "carpeta", "pared",
];

// Normaliza a minúsculas y saca acentos para matchear sin depender de tildes.
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

// Códigos de resistencia tipo H-20, H25, H-30... también disparan hormigón.
const CONCRETE_CODE = /h-?\d0/;

export function getLoadedModules(messages: Msg[]): KnowledgeModule[] {
  const text = normalize(messages.map((m) => m.content).join(" "));
  const modules: KnowledgeModule[] = ["base"];

  if (CONCRETE_KEYWORDS.some((k) => text.includes(k)) || CONCRETE_CODE.test(text)) {
    modules.push("concrete");
  }
  if (CORRALON_KEYWORDS.some((k) => text.includes(k))) {
    modules.push("corralon");
  }
  return modules;
}

export function buildDynamicPrompt(messages: Msg[], projectContext?: string): string {
  const modules = getLoadedModules(messages);
  const parts: string[] = [OMAR_BASE];

  if (modules.includes("concrete")) parts.push(CONCRETE_MODULE);
  if (modules.includes("corralon")) parts.push(CORRALON_MODULE);

  let prompt = parts.join("\n\n---\n\n");
  if (projectContext) {
    prompt += `\n\n---\n\nCONTEXTO DE OBRA ACTUAL\n\n${projectContext}`;
  }
  return prompt;
}
