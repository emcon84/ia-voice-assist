import { NextResponse } from "next/server";
import { googleSheetsService } from "@/services/googleSheetsService";
import jwt from "jsonwebtoken";

export const runtime = "nodejs";

export async function GET() {
  const result: Record<string, unknown> = {
    configured: googleSheetsService.isConfigured(),
    envVarsSet: {
      GOOGLE_SHEETS_CLIENT_EMAIL: !!process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
      GOOGLE_SHEETS_PRIVATE_KEY: !!process.env.GOOGLE_SHEETS_PRIVATE_KEY,
      GOOGLE_SHEETS_SPREADSHEET_ID: !!process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
    },
  };

  if (googleSheetsService.isConfigured()) {
    // Test JWT generation
    try {
      const rawKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY || "";
      const key = rawKey.includes("\\n") ? rawKey.replace(/\\n/g, "\n") : rawKey;
      result.keyFormat = {
        startsWith: key.startsWith("-----BEGIN"),
        endsWith: key.endsWith("-----"),
        length: key.length,
        hasRealNewlines: key.includes("\n"),
        hasLiteralN: key.includes("\\n"),
        first100: JSON.stringify(key.substring(0, 100)),
        last100: JSON.stringify(key.substring(key.length - 100)),
        charCodesAt0: key.charCodeAt(0),
        charCodesAt1: key.charCodeAt(1),
      };
    } catch (err: any) {
      result.jwtError = err.message;
    }

    // Test append
    try {
      const testResult = await googleSheetsService.appendLead({
        name: "TEST",
        phone: "0000000000",
        email: "test@test.com",
        type: "test",
        propertyType: "test",
        budget: "0",
        zone: "test",
        notes: "Diagnóstico automático",
        source: "debug",
      });
      result.appendResult = testResult;
    } catch (err: any) {
      result.appendError = err.message;
    }
  }

  return NextResponse.json(result);
}
