import { NextResponse } from "next/server";
import { googleSearchService } from "@/services/googleSearchService";

export const runtime = "nodejs";

/**
 * Endpoint de diagnóstico para verificar la búsqueda web.
 * Hace un test de búsqueda y devuelve el resultado.
 * Uso: GET /api/debug?q=test
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") || "departamentos alquiler Reconquista";

  const results: Record<string, unknown> = {
    googleConfigured: googleSearchService.isConfigured(),
    searchQuery: query,
  };

  if (googleSearchService.isConfigured()) {
    try {
      const googleResults = await googleSearchService.search(query);
      results.googleResults = googleResults;
      results.googleCount = googleResults.length;
    } catch (err) {
      results.googleError = err instanceof Error ? err.message : String(err);
    }
  } else {
    results.googleError = "No configurado (falta GOOGLE_SEARCH_API_KEY o GOOGLE_SEARCH_ENGINE_ID)";
  }

  return NextResponse.json(results);
}
