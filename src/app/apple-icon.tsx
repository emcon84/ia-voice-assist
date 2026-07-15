import { ImageResponse } from "next/og";
import { getActiveAssistant } from "@/assistants/registry";

// Ícono de Apple (touch icon) DINÁMICO. iOS aplica su propia máscara redondeada,
// por eso va cuadrado full-bleed (sin borderRadius).

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
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
          fontSize: 120,
          fontWeight: 700,
        }}
      >
        {identity.name.charAt(0)}
      </div>
    ),
    { ...size }
  );
}
