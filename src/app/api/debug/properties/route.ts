import { NextResponse } from "next/server";
import { sartorGraphqlService } from "@/services/sartorGraphqlService";

export const runtime = "nodejs";

/**
 * Endpoint de diagnóstico para verificar que fetchData funciona desde Vercel.
 * Uso: GET /api/debug/properties?q=departamento+alquiler
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") || "departamento alquiler";

  const result: Record<string, unknown> = {
    query,
    status: "ok",
  };

  try {
    const data = await sartorGraphqlService.fetchData(query);
    result.dataLength = data.length;
    result.preview = data.substring(0, 500);
  } catch (err) {
    result.status = "error";
    result.error = err instanceof Error ? err.message : String(err);
  }

  return NextResponse.json(result);
}
