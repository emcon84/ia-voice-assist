import { NextResponse } from "next/server";
import { sartorGraphqlService } from "@/services/sartorGraphqlService";

export const runtime = "nodejs";

const GRAPHQL_URL = "https://api.inmanager.com.ar/graphql";
const PROPERTY_SEARCH_QUERY = `
  query propertySearch($agencyIds: [Int], $per: Int, $attributes: PropertySearchInput) {
    propertySearch(agencyIds: $agencyIds, per: $per, attributes: $attributes) {
      properties {
        id
        price
        fullAddress
        description
        characteristics { name value }
        images { url smallUrl }
      }
    }
  }
`;

/**
 * Endpoint de diagnóstico para verificar que fetchData funciona desde Vercel.
 * Uso: GET /api/debug/properties?q=departamento+alquiler
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") || "departamento alquiler";

  const result: Record<string, unknown> = {
    query,
  };

  // Test 1: Raw fetch to GraphQL
  try {
    const rawResponse = await fetch(GRAPHQL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "User-Agent": "vercel-server" },
      body: JSON.stringify({
        query: `{ propertySearch(agencyIds: [1,2], per: 3) { properties { id price fullAddress } } }`,
      }),
    });
    const rawStatus = rawResponse.status;
    const rawText = await rawResponse.text();
    let rawJson: any = null;
    try { rawJson = JSON.parse(rawText); } catch {}
    result.rawFetch = { status: rawStatus, ok: rawResponse.ok, body: rawText.substring(0, 500) };
    if (rawJson?.data?.propertySearch?.properties) {
      result.rawCount = rawJson.data.propertySearch.properties.length;
    }
  } catch (err: any) {
    result.rawFetchError = err.message;
  }

  // Test 2: fetchData with no query (should return all)
  try {
    const data = await sartorGraphqlService.fetchData(query);
    result.fetchDataLength = data.length;
    result.fetchDataPreview = data.substring(0, 500);
  } catch (err: any) {
    result.fetchDataError = err.message;
  }

  return NextResponse.json(result);
}
