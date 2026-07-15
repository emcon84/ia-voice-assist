import { NextResponse } from "next/server";
import { getActiveAssistant } from "@/assistants/registry";

export const runtime = "nodejs";

function normalizeForTTS(
  text: string,
  brandRules: Array<{ pattern: RegExp; replace: string }> = []
): string {
  // Reglas específicas de la marca activa primero (siglas propias del negocio).
  const withBrand = brandRules.reduce(
    (acc, { pattern, replace }) => acc.replace(pattern, replace),
    text
  );
  return withBrand
    // Siglas de la institución: leer el nombre completo, no deletrear "u a a"
    .replace(/\bUAA\b/g, "Unión Agrícola de Avellaneda")
    // Direcciones: "N°"/"Nº"/"Nro" → "número"; "Av." → "Avenida"
    .replace(/\bN[°ºro.]*\s*(?=\d)/gi, "número ")
    .replace(/\bAv\.?\s+/g, "Avenida ")
    // Emails: deletrear símbolos (arroba, punto, guión) para que no se lean crudos
    .replace(/([A-Za-z0-9._%+-]+)@([A-Za-z0-9.-]+\.[A-Za-z]{2,})/g, (_m, user, domain) => {
      const say = (s: string) =>
        s.replace(/\./g, " punto ").replace(/-/g, " guión ").replace(/_/g, " guión bajo ");
      return `${say(user)} arroba ${say(domain)}`;
    })
    // Hormigonar → Ormigonar (H muda en español)
    .replace(/\bHORMIGONAR\b/g, "Ormigonar")
    .replace(/\bHormigonar\b/g, "Ormigonar")
    .replace(/\bhormigonar\b/g, "ormigonar")
    // Códigos de producto H-210, H-250, etc. → solo el número
    .replace(/\bH-(\d+)\b/g, "$1")
    .replace(/\bH(\d{3,})\b/g, "$1")
    // Unidades técnicas de presión/fuerza
    .replace(/\bMPa\b/g, "megapascales")
    .replace(/\bhPa\b/gi, "ectopascales")
    .replace(/\bkgf\/cm[²2]\b/g, "kilogramos por centímetro cuadrado")
    .replace(/\bkgf\b/g, "kilogramos fuerza")
    // Unidades de medida — orden importa: primero las compuestas
    .replace(/\bm[³3]\b/g, "metros cúbicos")
    .replace(/\bm[²2]\b/g, "metros cuadrados")
    .replace(/\bcm[²2]\b/g, "centímetros cuadrados")
    .replace(/\bcm[³3]\b/g, "centímetros cúbicos")
    .replace(/\bmm\b/g, "milímetros")
    .replace(/\bcm\b/g, "centímetros")
    .replace(/\bkm\b/g, "kilómetros")
    .replace(/\b(\d+)\s*m\b/g, "$1 metros")
    .replace(/\bkg\b/g, "kilogramos")
    .replace(/\bl\b/g, "litros")
    .replace(/\bml\b/g, "mililitros")
    // Internos telefónicos: leerlos dígito por dígito ("dos, seis, dos"), no
    // como cantidad ("doscientos sesenta y dos"). Captura toda la lista tras
    // "interno(s)" con separadores coma / "o" / "y" y deletrea cada grupo.
    .replace(/\b(internos?)\s+(\d{1,4}(?:\s*(?:,|o|y)\s*\d{1,4})*)/gi, (_m, word, list) =>
      `${word} ${list.replace(/\d+/g, (d: string) => d.split("").join(" "))}`)
    // Teléfono con área + número (separados por espacio): deletrear todos los
    // dígitos, con coma entre grupos para una pausa natural. El área de 4 dígitos
    // también se deletrea. Los códigos CIRSOC van con guión, no espacio → no matchea.
    .replace(/\b\d{3,5}\s\d{4,}\b/g, (m) =>
      m.split(/\s+/).map((g) => g.split("").join(" ")).join(", "))
    // Cualquier otra tira larga suelta (5+ dígitos) también dígito por dígito.
    // Deja intactos números chicos: internos (130), cantidades, años (2024).
    .replace(/\d{5,}/g, (m) => m.split("").join(" "));
}

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "ELEVENLABS_API_KEY not set" }, { status: 500 });
    }

    const assistant = getActiveAssistant();

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${assistant.voice.ttsVoiceId}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: normalizeForTTS(text, assistant.voice.normalizationRules),
          model_id: assistant.voice.ttsModel ?? "eleven_turbo_v2_5",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ElevenLabs TTS error:", response.status, errorText);
      if (response.status === 429 || response.status === 402 ||
          errorText.includes("quota") || errorText.includes("limit") || errorText.includes("credit")) {
        return NextResponse.json({ error: "NO_CREDITS", service: "elevenlabs" }, { status: 402 });
      }
      return NextResponse.json({ error: errorText }, { status: 500 });
    }

    const audioBuffer = await response.arrayBuffer();
    return new NextResponse(audioBuffer, {
      headers: { "Content-Type": "audio/mpeg" },
    });
  } catch (error) {
    console.error("TTS error:", error);
    return NextResponse.json({ error: "TTS failed" }, { status: 500 });
  }
}
