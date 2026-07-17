import type { AssistantConfig } from "../_contract";
import { SARTOR_BASE } from "@/data/knowledge/sartor-base";
import { sartorGraphqlService } from "@/services/sartorGraphqlService";

export const sartorConfig: AssistantConfig = {
  id: "sartor",
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
    onboarding: {
      questions: [
        "¿Qué tipo de propiedad estás buscando? (casa, departamento, duplex, PH, terreno, local, cochera)",
        "¿Cuántos ambientes o dormitorios necesitás?",
        "¿En qué zona o barrio preferís? (Reconquista, Avellaneda, zona norte, etc.)",
        "¿Cuál es tu presupuesto aproximado? (en pesos o USD)",
      ],
      closingInstruction:
        "Cuando tengas todos los datos del usuario, buscá propiedades que coincidan con sus criterios usándolos como filtros. Si encontrás, mostralas con precio y link. Si no hay coincidencias exactas, ofrecé opciones similares o preguntá si quiere ajustar.",
    },
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
    colors: { primary: "#1a5276", accent: "#2980b9", danger: "#dc2626" },
    logo: "",
    accessCode: "sartor2025",
    baseUrl: "http://localhost:3000",
  },

  whatsapp: {
    welcomeMessage: {
      body: "¡Hola! Soy Sofia, la asistente de Sartor Inmobiliaria.\n\n¿Qué necesitás? Elegí una opción:",
      footer: "Respondé o tocá una opción cuando quieras",
      buttonText: "Ver opciones",
      sections: [
        {
          title: "¿Qué querés hacer?",
          rows: [
            { id: "comprar", title: "Comprar", description: "Buscar propiedades en venta" },
            { id: "alquilar", title: "Alquilar", description: "Buscar propiedades en alquiler" },
            { id: "vender", title: "Vender", description: "Publicar tu propiedad" },
            { id: "tasar", title: "TasAr", description: "Tasación de tu propiedad" },
          ],
        },
      ],
    },
  },

  models: {
    chat: "claude-sonnet-4-6",
    stt: "whisper-large-v3-turbo",
  },
};
