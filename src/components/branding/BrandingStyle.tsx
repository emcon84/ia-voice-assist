import { getActiveAssistant } from "@/assistants/registry";

// Inyecta los colores de la marca ACTIVA como variables CSS de :root.
// Server component: viaja en el HTML inicial, sin parpadeo ni JS de cliente.
// globals.css define la estructura (grises, dark/light); esto solo pisa el
// color de marca. Cambiás NEXT_PUBLIC_ASSISTANT_ID y toda la UI se repinta.
export default function BrandingStyle() {
  const { colors } = getActiveAssistant().branding;
  const css = `:root{--primary:${colors.primary};--accent:${colors.accent};--yellow:${colors.primary};}`;
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}
