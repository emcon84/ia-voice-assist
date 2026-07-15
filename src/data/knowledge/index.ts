// Barrel del conocimiento de Omar.
// - OMAR_BASE: identidad + directorio de la cooperativa (siempre presente).
// - CONCRETE_MODULE / CORRALON_MODULE: cerebros profundos (los carga el router).
// - buildFullOmarPrompt: Omar completo con todos los módulos (para la sesión realtime).
// - buildOnboardingPrompt: entrevista de perfil de obra.

import { OMAR_BASE } from "./omar-base";
import { CONCRETE_MODULE } from "./concrete";
import { CORRALON_MODULE } from "./corralon";

export { OMAR_BASE } from "./omar-base";
export { CONCRETE_MODULE } from "./concrete";
export { CORRALON_MODULE } from "./corralon";
export { buildOnboardingPrompt } from "./onboarding";

// Omar con TODOS los módulos cargados. Se usa donde no hay routing dinámico
// (por ejemplo la sesión de voz realtime, que necesita todo el conocimiento de entrada).
export function buildFullOmarPrompt(): string {
  return [OMAR_BASE, CONCRETE_MODULE, CORRALON_MODULE].join("\n\n---\n\n");
}
