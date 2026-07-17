const KAPSO_API_BASE = "https://api.kapso.ai/meta/whatsapp/v24.0";

export async function sendTextMessage(
  phoneNumberId: string,
  to: string,
  text: string
): Promise<void> {
  const apiKey = process.env.KAPSO_API_KEY;
  if (!apiKey) throw new Error("KAPSO_API_KEY not set");

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
      type: "text",
      text: { body: text },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Kapso API error ${res.status}: ${body}`);
  }
}
