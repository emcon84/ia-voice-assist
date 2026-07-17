import type { AssistantConfig } from "../_contract";
import { SARTOR_BASE } from "@/data/knowledge/sartor-base";
import { sartorGraphqlService } from "@/services/sartorGraphqlService";

export const sartorConfig: AssistantConfig = {
  id: "sartor",

  // Provider genérico: le pega a la API GraphQL en tiempo real
  dataProvider: sartorGraphqlService,

  identity: {
    name: "Sofia",
    company: "Sartor Inmobiliaria",
    tagline: "Tu asesora inmobiliaria de confianza",
  },

  persona: {
    basePrompt: SARTOR_BASE,
  },

  knowledge: {
    modules: [
      {
        id: "propiedades",
        keywords: [
          "propiedad", "propiedades", "departamento", "casa", "duplex",
          "alquiler", "alquilar", "venta", "comprar", "vender",
          "precio", "precios", "disponible", "disponibilidad",
          "ubicación", "zona", "reconquista", "avellaneda",
          "dormitorio", "ambiente", "cochera", "local",
          "terreno", "lote", "mostrar", "mostrame", "buscar",
          "listado", "catálogo", "catalogo", "link", "enlace",
        ],
        content: SARTOR_BASE,
      },
    ],
  },

  voice: {
    ttsVoiceId: "h60rOzgfLmYsntfqgGu2",
    ttsModel: "eleven_turbo_v2_5",
    sttLang: "es",
    normalizationRules: [
      { pattern: /\bSartor\b/g, replace: "Sartor" },
      { pattern: /https?:\/\/[^\s]+/g, replace: "" },
      { pattern: /\s*Link:\s*/gi, replace: " " },
    ],
  },

  branding: {
    colors: {
      primary: "#1a5276",
      accent: "#2980b9",
      danger: "#dc2626",
    },
    logo: "",
    accessCode: "sartor2025",
    baseUrl: "http://localhost:3000",
  },

  models: {
    chat: "claude-sonnet-4-6",
    stt: "whisper-large-v3-turbo",
  },
};
