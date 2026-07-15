import { ImageResponse } from "next/og";
import { getActiveAssistant } from "@/assistants/registry";

// Favicon DINÁMICO: se genera con el color y la inicial de la marca activa.
// Convención de Next (app/icon.tsx) → Next lo cablea solo como <link rel="icon">.
// Cambiás NEXT_PUBLIC_ASSISTANT_ID y el favicon cambia con la marca.

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  const { identity, branding } = getActiveAssistant();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: branding.colors.primary,
          color: "#ffffff",
          fontSize: 44,
          fontWeight: 700,
          borderRadius: 14,
        }}
      >
        {identity.name.charAt(0)}
      </div>
    ),
    { ...size }
  );
}
