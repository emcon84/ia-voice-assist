import jwt from "jsonwebtoken";

export interface LeadData {
  name: string;
  phone: string;
  email?: string;
  type: string;
  propertyType: string;
  budget: string;
  zone: string;
  notes: string;
  source: string;
}

function getPrivateKey(): string {
  let key = process.env.GOOGLE_SHEETS_PRIVATE_KEY || "";

  // Strip surrounding quotes if present (from JSON copy-paste)
  key = key.replace(/^["']|["']$/g, "");

  // Convert literal \n to real newlines
  if (key.includes("\\n")) {
    key = key.replace(/\\n/g, "\n");
  }

  // Trim any leading/trailing whitespace
  key = key.trim();

  return key;
}

function isConfigured(): boolean {
  return !!(
    process.env.GOOGLE_SHEETS_PRIVATE_KEY &&
    process.env.GOOGLE_SHEETS_CLIENT_EMAIL &&
    process.env.GOOGLE_SHEETS_SPREADSHEET_ID
  );
}

async function getAccessToken(): Promise<string> {
  const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL!;
  const privateKey = getPrivateKey();
  const now = Math.floor(Date.now() / 1000);

  const signedJwt = jwt.sign(
    {
      iss: clientEmail,
      scope: "https://www.googleapis.com/auth/spreadsheets",
      aud: "https://oauth2.googleapis.com/token",
      exp: now + 3600,
      iat: now,
    },
    privateKey,
    { algorithm: "RS256" }
  );

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: signedJwt,
    }),
  });

  const data = await res.json();
  if (!data.access_token) {
    throw new Error(data.error_description || "Failed to get access token");
  }
  return data.access_token;
}

async function appendLead(lead: LeadData): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    if (!isConfigured()) {
      return { ok: false, error: "Google Sheets not configured" };
    }

    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID!;
    const accessToken = await getAccessToken();

    const timestamp = new Date().toISOString();
    const row = [
      timestamp,
      lead.name,
      lead.phone,
      lead.email || "",
      lead.type,
      lead.propertyType,
      lead.budget,
      lead.zone,
      lead.notes || "",
      lead.source,
    ];

    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A:J:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          range: "A:J",
          majorDimension: "ROWS",
          values: [row],
        }),
      }
    );

    if (!res.ok) {
      const body = await res.text();
      return { ok: false, error: `Sheets API error: ${res.status} ${body}` };
    }

    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message || "Unknown error" };
  }
}

export const googleSheetsService = {
  isConfigured,
  appendLead,
};
