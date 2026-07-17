/**
 * QUESTIONNAIRE SERVICE
 *
 * State machine que maneja conversaciones guiadas por botones en WhatsApp.
 * Después de que el usuario elige del menú de bienvenida (comprar/alquilar/vender/tasar),
 * este servicio se encarga de preguntar paso a paso con listas interactivas o texto.
 *
 * Al completar todos los pasos, devuelve las respuestas acumuladas para que
 * el webhook las pase a la IA.
 */

export interface QuestionStep {
  id: string;
  question: string;
  /** "list" = mensaje interactivo con opciones, "text" = el usuario escribe libre */
  type: "list" | "text";
  /** Texto del botón que abre la lista (solo para type: "list") */
  buttonText?: string;
  /** Opciones de la lista (solo para type: "list") */
  options?: Array<{
    id: string;
    title: string;
    description?: string;
  }>;
}

export interface QuestionnaireFlow {
  flowId: string;
  steps: QuestionStep[];
}

export interface QuestionnaireSession {
  flowId: string;
  currentStep: number;
  answers: Record<string, string>;
}

// ─── FLOWS ────────────────────────────────────────────────────────────────────

const FLOWS: Record<string, QuestionnaireFlow> = {
  comprar: {
    flowId: "comprar",
    steps: [
      {
        id: "type",
        question: "¿Qué tipo de propiedad estás buscando?",
        type: "list",
        buttonText: "Elegir tipo",
        options: [
          { id: "casa", title: "Casa", description: "Casas en venta" },
          { id: "departamento", title: "Departamento", description: "Departamentos en venta" },
          { id: "duplex", title: "Dúplex" },
          { id: "ph", title: "PH" },
          { id: "terreno", title: "Terreno / Lote" },
          { id: "local", title: "Local comercial" },
        ],
      },
      {
        id: "rooms",
        question: "¿Cuántos ambientes o dormitorios necesitás?",
        type: "list",
        buttonText: "Elegir",
        options: [
          { id: "1", title: "1 ambiente" },
          { id: "2", title: "2 ambientes" },
          { id: "3", title: "3 ambientes" },
          { id: "4", title: "4 o más" },
        ],
      },
      {
        id: "zone",
        question: "¿En qué zona o barrio preferís?",
        type: "list",
        buttonText: "Elegir zona",
        options: [
          { id: "centro", title: "Centro" },
          { id: "reconquista", title: "Reconquista" },
          { id: "avellaneda", title: "Avellaneda" },
          { id: "zona-norte", title: "Zona norte" },
          { id: "otra", title: "Otra" },
        ],
      },
      {
        id: "budget",
        question: "¿Cuál es tu presupuesto aproximado? Decime el monto o te muestro opciones.",
        type: "text",
      },
    ],
  },

  alquilar: {
    flowId: "alquilar",
    steps: [
      {
        id: "type",
        question: "¿Qué tipo de propiedad buscás para alquilar?",
        type: "list",
        buttonText: "Elegir tipo",
        options: [
          { id: "casa", title: "Casa", description: "Casas en alquiler" },
          { id: "departamento", title: "Departamento", description: "Departamentos en alquiler" },
          { id: "duplex", title: "Dúplex" },
          { id: "ph", title: "PH" },
          { id: "local", title: "Local comercial" },
        ],
      },
      {
        id: "rooms",
        question: "¿Cuántos ambientes necesitás?",
        type: "list",
        buttonText: "Elegir",
        options: [
          { id: "1", title: "1 ambiente" },
          { id: "2", title: "2 ambientes" },
          { id: "3", title: "3 ambientes" },
          { id: "4", title: "4 o más" },
        ],
      },
      {
        id: "zone",
        question: "¿En qué zona preferís?",
        type: "list",
        buttonText: "Elegir zona",
        options: [
          { id: "centro", title: "Centro" },
          { id: "reconquista", title: "Reconquista" },
          { id: "avellaneda", title: "Avellaneda" },
          { id: "zona-norte", title: "Zona norte" },
          { id: "otra", title: "Otra" },
        ],
      },
      {
        id: "budget",
        question: "¿Cuál es tu presupuesto máximo de alquiler?",
        type: "text",
      },
    ],
  },

  vender: {
    flowId: "vender",
    steps: [
      {
        id: "type",
        question: "¿Qué tipo de propiedad querés vender?",
        type: "list",
        buttonText: "Elegir tipo",
        options: [
          { id: "casa", title: "Casa" },
          { id: "departamento", title: "Departamento" },
          { id: "terreno", title: "Terreno / Lote" },
          { id: "local", title: "Local comercial" },
          { id: "otro", title: "Otro" },
        ],
      },
      {
        id: "zone",
        question: "¿En qué zona está la propiedad?",
        type: "list",
        buttonText: "Elegir zona",
        options: [
          { id: "reconquista", title: "Reconquista" },
          { id: "avellaneda", title: "Avellaneda" },
          { id: "zona-norte", title: "Zona norte" },
          { id: "otra", title: "Otra" },
        ],
      },
      {
        id: "details",
        question: "Contame brevemente las características principales (metros, antigüedad, estado general).",
        type: "text",
      },
    ],
  },

  tasar: {
    flowId: "tasar",
    steps: [
      {
        id: "type",
        question: "¿Qué tipo de propiedad querés tasar?",
        type: "list",
        buttonText: "Elegir tipo",
        options: [
          { id: "casa", title: "Casa" },
          { id: "departamento", title: "Departamento" },
          { id: "terreno", title: "Terreno / Lote" },
          { id: "local", title: "Local comercial" },
          { id: "otro", title: "Otro" },
        ],
      },
      {
        id: "zone",
        question: "¿En qué zona está ubicada?",
        type: "list",
        buttonText: "Elegir zona",
        options: [
          { id: "reconquista", title: "Reconquista" },
          { id: "avellaneda", title: "Avellaneda" },
          { id: "zona-norte", title: "Zona norte" },
          { id: "otra", title: "Otra" },
        ],
      },
      {
        id: "details",
        question: "Decime los detalles: metros cuadrados, antigüedad, estado general, y cualquier otra característica relevante.",
        type: "text",
      },
    ],
  },
};

// ─── SESSION STORE ────────────────────────────────────────────────────────────
// ⚠️ En memoria: se pierde con cold starts de Vercel. Migrar a KV en producción.

const sessions = new Map<string, QuestionnaireSession>();

// ─── API ──────────────────────────────────────────────────────────────────────

export function startSession(convId: string, flowId: string): QuestionnaireSession {
  const session: QuestionnaireSession = {
    flowId,
    currentStep: 0,
    answers: {},
  };
  sessions.set(convId, session);
  return session;
}

export function getSession(convId: string): QuestionnaireSession | undefined {
  return sessions.get(convId);
}

export function getCurrentStep(convId: string): QuestionStep | null {
  const session = sessions.get(convId);
  if (!session) return null;
  const flow = FLOWS[session.flowId];
  if (!flow) return null;
  const step = flow.steps[session.currentStep];
  return step ?? null;
}

/**
 * Procesa la respuesta del usuario y avanza al siguiente paso.
 * Devuelve el resultado: si hay más pasos, el siguiente a preguntar.
 * Si se completaron todos, devuelve el objeto con las respuestas.
 */
export function processAnswer(
  convId: string,
  answer: string
): { done: false; step: QuestionStep } | { done: true; answers: Record<string, string> } {
  const session = sessions.get(convId);
  if (!session) return { done: true, answers: {} };

  const flow = FLOWS[session.flowId];
  if (!flow) return { done: true, answers: {} };

  const step = flow.steps[session.currentStep];
  if (!step) return { done: true, answers: session.answers };

  // Store answer
  session.answers[step.id] = answer;

  // Advance
  session.currentStep++;

  // Check if done
  if (session.currentStep >= flow.steps.length) {
    sessions.delete(convId); // clean up
    return { done: true, answers: { ...session.answers } };
  }

  return { done: false, step: flow.steps[session.currentStep] };
}

/**
 * Checkea si el flowId es válido (comprar/alquilar/vender/tasar).
 */
export function isValidFlow(flowId: string): boolean {
  return flowId in FLOWS;
}

/**
 * Devuelve el primer paso de un flow (para enviar después de la bienvenida).
 */
export function getFirstStep(flowId: string): QuestionStep | null {
  const flow = FLOWS[flowId];
  if (!flow || flow.steps.length === 0) return null;
  return flow.steps[0];
}

/**
 * Devuelve el texto compilado de todas las respuestas para pasar a la IA.
 */
export function compileAnswers(flowId: string, answers: Record<string, string>): string {
  const flow = FLOWS[flowId];
  if (!flow) return "";

  const lines = [`OPERACIÓN: ${flowId}`];
  for (const step of flow.steps) {
    const answer = answers[step.id];
    if (answer) {
      lines.push(`${step.id.toUpperCase()}: ${answer}`);
    }
  }
  return lines.join("\n");
}
