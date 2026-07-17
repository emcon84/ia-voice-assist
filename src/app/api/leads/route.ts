import { NextResponse } from "next/server";
import { googleSheetsService, type LeadData } from "@/services/googleSheetsService";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json() as Partial<LeadData>;

    if (!body.name || !body.phone) {
      return NextResponse.json(
        { ok: false, error: "name and phone are required" },
        { status: 400 }
      );
    }

    if (!googleSheetsService.isConfigured()) {
      return NextResponse.json({ ok: true, warning: "sheets not configured" });
    }

    const lead: LeadData = {
      name: body.name,
      phone: body.phone,
      email: body.email || "",
      type: body.type || "",
      propertyType: body.propertyType || "",
      budget: body.budget || "",
      zone: body.zone || "",
      notes: body.notes || "",
      source: body.source || "web",
    };

    const result = await googleSheetsService.appendLead(lead);

    if (!result.ok) {
      return NextResponse.json(result, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
