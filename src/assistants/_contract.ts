// CONTRATO ÚNICO de un asistente de voz.
//
// El código (hooks, API routes, UI) depende de ESTA interfaz, NUNCA de una marca
// concreta. Cada negocio = una implementación de AssistantConfig (ver registry.ts).
// Esto es Inversión de Dependencias (la D de SOLID): onboarding.ts ya no ES "Omar",
// recibe una config y no sabe ni le importa si es Lucas, Omar o Max.

import type { WizardQuestion } from "@/types/wizard";

/**
 * Módulo de conocimiento "profundo" que se carga on-demand según las keywords
 * detectadas en el mensaje del usuario. Reemplaza el knowledge-router hardcodeado.
 */
export interface KnowledgeModule {
  /** Identificador del módulo (ej. "taxes", "concrete"). */
  id: string;
  /** Palabras clave que disparan la carga de este módulo. */
  keywords: string[];
  /** Patrones extra (ej. códigos H-20, categorías de monotributo). */
  codePatterns?: RegExp[];
  /** El contenido del "cerebro" que se inyecta al system prompt. */
  content: string;
}

/** Nombre visible y datos de la marca. */
export interface AssistantIdentity {
  /** Nombre del asistente. Ej. "Lucas", "Omar", "Max". */
  name: string;
  /** Empresa/estudio que representa. Ej. "Contabía", "Unión Agrícola de Avellaneda". */
  company: string;
  /** Subtítulo corto para UI. Ej. "Tu asistente contable". */
  tagline: string;
}

/** Persona base: identidad + reglas de comportamiento SIEMPRE cargadas. */
export interface AssistantPersona {
  /** System prompt base (identidad, tono, reglas de voz, directorio). Siempre presente. */
  basePrompt: string;
}

/** Onboarding opcional: entrevista estructurada para armar un perfil. */
export interface OnboardingConfig {
  /** Preguntas de la entrevista, en orden. */
  questions: string[];
  /** Instrucción de cierre (tag de contexto generado, etc.). */
  closingInstruction: string;
}

/** Configuración de voz. Nada de voces hardcodeadas en las rutas. */
export interface VoiceConfig {
  /** ID de voz de ElevenLabs (TTS por streaming). */
  ttsVoiceId: string;
  /** Modelo de TTS. Default eleven_turbo_v2_5. */
  ttsModel?: string;
  /** Idioma para STT (Groq Whisper). Ej. "es". */
  sttLang: string;
  /** Reglas de normalización de texto antes del TTS (siglas, unidades, marca). */
  normalizationRules?: Array<{ pattern: RegExp; replace: string }>;
}

/** Branding visual y config de acceso. */
export interface BrandingConfig {
  colors: {
    primary: string;
    accent: string;
    danger: string;
  };
  /** Path público del logo. Ej. "/contabia-logo.png". */
  logo: string;
  /** Código de acceso al demo (gate sin login). */
  accessCode: string;
  /** URL base de la app (metadata, OG). */
  baseUrl: string;
}

/** Captación de leads por email. Opcional: un demo puede no mandar nada real. */
export interface LeadsConfig {
  fromEmail: string;
  toEmail: string;
}

/**
 * Provider opcional de datos dinámicos.
 * Cada asistente puede implementarlo a su manera (API GraphQL, REST, scraper, etc.)
 * sin que el core sepa nada de la fuente. Esto mantiene el sistema genérico.
 */
export interface DataProvider {
  /** Recibe el texto del usuario y devuelve texto formateado para injectar en el prompt. */
  fetchData(userText: string): Promise<string>;
}

/** Modelos de IA usados por este asistente. */
export interface ModelsConfig {
  /** Modelo de chat de texto (Anthropic). Ej. "claude-sonnet-4-6". */
  chat: string;
  /** Modelo de STT (Groq). Ej. "whisper-large-v3-turbo". */
  stt?: string;
}

/** Producto genérico del catálogo (opcional por marca). */
export interface CatalogProduct {
  id: string;
  name: string;
  description: string;
  tags?: string[];
  [extra: string]: unknown;
}

/**
 * CONTRATO COMPLETO de un asistente.
 *
 * Campos opcionales (wizard, products, leads, onboarding): un negocio mínimo
 * — como un demo para reels — no está obligado a tenerlos. El código debe
 * degradar con gracia cuando faltan.
 */
export interface AssistantConfig {
  /** Identificador único. Coincide con NEXT_PUBLIC_ASSISTANT_ID. Ej. "demo". */
  id: string;

  identity: AssistantIdentity;
  persona: AssistantPersona;

  knowledge: {
    /** Módulos profundos cargados on-demand por keywords. Puede ir vacío. */
    modules: KnowledgeModule[];
    /** Entrevista de onboarding opcional. */
    onboarding?: OnboardingConfig;
  };

  /** Provider de datos dinámicos (opcional). Si existe, se consulta en cada request. */
  dataProvider?: DataProvider;

  /** Wizard visual opcional (no todo negocio lo tiene). */
  wizard?: {
    questions: WizardQuestion[];
  };

  /** Catálogo de productos opcional. */
  products?: CatalogProduct[];

  voice: VoiceConfig;
  branding: BrandingConfig;

  /** Captación de leads opcional. */
  leads?: LeadsConfig;

  models: ModelsConfig;
}
