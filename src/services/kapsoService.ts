const KAPSO_API_BASE = "https://api.kapso.ai/meta/whatsapp/v24.0";

function getApiKey(): string {
  const key = process.env.KAPSO_API_KEY;
  if (!key) throw new Error("KAPSO_API_KEY not set");
  return key;
}

async function postMessage(
  phoneNumberId: string,
  to: string,
  body: Record<string, unknown>
): Promise<void> {
  const apiKey = getApiKey();
  const res = await fetch(`${KAPSO_API_BASE}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      "X-API-Key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      ...body,
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Kapso API error ${res.status}: ${errBody}`);
  }
}

export async function sendTextMessage(
  phoneNumberId: string,
  to: string,
  text: string
): Promise<void> {
  await postMessage(phoneNumberId, to, {
    type: "text",
    text: { body: text },
  });
}

export interface ListSectionRow {
  id: string;
  title: string;
  description?: string;
}

export interface ListSection {
  title?: string;
  rows: ListSectionRow[];
}

export async function sendListMessage(
  phoneNumberId: string,
  to: string,
  bodyText: string,
  buttonText: string,
  sections: ListSection[],
  footerText?: string
): Promise<void> {
  const interactive: Record<string, unknown> = {
    type: "list",
    body: { text: bodyText },
    action: {
      button: buttonText,
      sections,
    },
  };

  if (footerText) {
    interactive.footer = { text: footerText };
  }

  await postMessage(phoneNumberId, to, {
    type: "interactive",
    interactive,
  });
}
