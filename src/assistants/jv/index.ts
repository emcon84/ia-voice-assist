// Config del asistente VALENTINA — JV Desarrollos Inmobiliarios.
// Asistente especializado en asesoramiento inmobiliario en el norte de Santa Fe.

import type { AssistantConfig } from "../_contract";
import { JV_BASE } from "@/data/knowledge/jv-base";
import { JV_PROPERTIES_TEXT } from "@/data/knowledge/jv-properties";
import { INMOBILIARIA_MODULE } from "./knowledge/inmobiliaria";

export const jvConfig: AssistantConfig = {
  id: "jv",

  identity: {
    name: "Valentina",
    company: "JV Desarrollos Inmobiliarios",
    tagline: "Tu asesora inmobiliaria de confianza",
  },

  persona: {
    basePrompt: JV_BASE,
  },

  knowledge: {
    modules: [
      {
        id: "propiedades",
        keywords: [
          "propiedad", "propiedades", "departamento", "casa", "duplex",
          "alquiler", "alquilar", "venta", "comprar",
          "precio", "precios", "disponible", "disponibilidad",
          "ubicación", "zona", "bulevar", "bulevares",
          "reconquista", "villa ocampo",
          "dormitorio", "ambiente", "cochera", "local",
          "terreno", "lote", "mostrar", "mostrame", "buscar",
          "listado", "catálogo", "catalogo", "link", "enlace",
        ],
        content: JV_PROPERTIES_TEXT,
      },
      {
        id: "inmobiliaria",
        keywords: [
          "comprar",
          "vender",
          "alquilar",
          "alquiler",
          "venta",
          "propiedad",
          "departamento",
          "casa",
          "duplex",
          "dúplex",
          "local",
          "terreno",
          "lote",
          "tasar",
          "tasación",
          "tasa",
          "precio",
          "precios",
          "zona",
          "bulevar",
          "bulevares",
          "reconquista",
          "reconquista",
          "villa ocampo",
          "contrato",
          "escritura",
          "inmueble",
          "inmobiliaria",
          "alquiler temporario",
          "temporada",
          "garantía",
          "garantia",
          "cochera",
          "dormitorio",
          "ambiente",
          "moneda extranjera",
          "dolares",
          "dólares",
          "financiación",
          "financiacion",
          "credito",
          "crédito",
          "hipotecario",
        ],
        content: INMOBILIARIA_MODULE,
      },
    ],
  },

  voice: {
    ttsVoiceId: "h60rOzgfLmYsntfqgGu2",
    ttsModel: "eleven_turbo_v2_5",
    sttLang: "es",
    normalizationRules: [
      { pattern: /\bJV\b/g, replace: "Jota Vé" },
      { pattern: /\bRE\/MAX\b/g, replace: "Re Max" },
    ],
  },

  branding: {
    colors: {
      primary: "#1a4d7a", // Azul corporativo — confianza/inmobiliario
      accent: "#2d7fc1",
      danger: "#dc2626",
    },
    logo: "/jv-logo.png",
    accessCode: "jv2025",
    baseUrl: "http://localhost:3000",
  },

  models: {
    chat: "claude-sonnet-4-6",
    stt: "whisper-large-v3-turbo",
  },
};
