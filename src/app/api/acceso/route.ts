import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// Código de acceso de la demo. Se lee de env; si no está, usa un default
// para que la demo funcione out-of-the-box. Cambialo por cliente.
const DEMO_CODE = process.env.DEMO_ACCESS_CODE || "hormigonar2026";

export async function POST(req: NextRequest) {
  try {
    const { code } = (await req.json()) as { code?: string };

    if (!code || code.trim() !== DEMO_CODE) {
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
