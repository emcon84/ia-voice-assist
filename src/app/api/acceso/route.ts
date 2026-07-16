import { NextRequest, NextResponse } from "next/server";
import { getActiveAssistant } from "@/assistants/registry";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { code } = (await req.json()) as { code?: string };

    // El código de acceso viene de la config del asistente activo.
    // Así cada marca tiene su propio código sin tocar rutas.
    const config = getActiveAssistant();

    if (!code || code.trim() !== config.branding.accessCode) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    const res = NextResponse.json({ ok: true });
    res.cookies.set("demo_access", "1", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 días
    });
    return res;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
