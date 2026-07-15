// Config del asistente DEMO: Lucas, del estudio contable Contabía (FICTICIO).
// Especializado en impuestos/monotributo para reels de promoción.
//
// Nótese lo MÍNIMO que es: sin wizard, sin products, sin leads, sin onboarding
// estructurado. Solo lo requerido + un módulo de conocimiento. Eso demuestra que
// los campos opcionales de AssistantConfig degradan con gracia.

import type { AssistantConfig } from "../_contract";
import { LUCAS_BASE } from "@/data/knowledge/lucas-base";
import { TAXES_MODULE } from "./knowledge/taxes";

export const demoConfig: AssistantConfig = {
  id: "demo",

  identity: {
    name: "Lucas",
    company: "Contabía",
    tagline: "Tu asistente contable",
  },

  persona: {
    basePrompt: LUCAS_BASE,
  },

  knowledge: {
    modules: [
      {
        id: "taxes",
        keywords: [
          "monotributo",
          "categoria",
          "categoría",
          "recategorizar",
          "recategorización",
          "iva",
          "ganancias",
          "responsable inscripto",
          "autonomo",
          "autónomo",
          "factura",
          "facturación",
          "facturacion",
          "vencimiento",
          "arca",
          "afip",
          "ingresos brutos",
          "iibb",
          "impuesto",
          "impuestos",
          "aporte",
          "jubilacion",
          "jubilación",
          "obra social",
          "cuit",
          "alta",
          "baja",
          "exclusion",
          "exclusión",
          "tope",
        ],
        content: TAXES_MODULE,
      },
    ],
    // Sin onboarding estructurado: Lucas hace perfilado conversacional (ver LUCAS_BASE).
  },

  // Sin wizard, sin products, sin leads: es un demo de voz para reels.

  voice: {
    // TODO: reemplazar por una voz masculina propia de Lucas en ElevenLabs.
    ttsVoiceId: "QK4xDwo9ESPHA4JNUpX3",
    ttsModel: "eleven_turbo_v2_5",
    sttLang: "es",
    normalizationRules: [
      { pattern: /\bIIBB\b/g, replace: "Ingresos Brutos" },
      { pattern: /\bR\.?I\.?\b/g, replace: "Responsable Inscripto" },
    ],
  },

  branding: {
    colors: {
      primary: "#0d9488", // teal — confianza/finanzas
      accent: "#14b8a6",
      danger: "#dc2626",
    },
    logo: "/contabia-logo.png",
    accessCode: "contabia2026",
    baseUrl: "http://localhost:3000",
  },

  models: {
    chat: "claude-sonnet-4-6",
    stt: "whisper-large-v3-turbo",
  },
};
