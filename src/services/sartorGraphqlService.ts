import type { DataProvider } from "@/assistants/_contract";

const GRAPHQL_ENDPOINT = "https://api.inmanager.com.ar/graphql";

const PROPERTY_SEARCH_QUERY = `
query propertySearch($agencyIds: [Int], $limit: Int, $attributes: [PropertyAttributeInput]) {
  propertySearch(agencyIds: $agencyIds, limit: $limit, attributes: $attributes) {
    id
    propertyType
    price
    operationTypes
    fullAddress
    description
    images {
      url
      thumbUrl
      smallUrl
    }
    characteristics {
      name
    }
    lat
    lng
  }
}
`;

interface SartorProperty {
  id: string;
  propertyType: string;
  price: string;
  operationTypes: string[];
  fullAddress: string;
  description: string;
  characteristics: { name: string }[];
  lat?: number;
  lng?: number;
}

class SartorGraphqlService implements DataProvider {
  private async query(query: string, variables?: Record<string, unknown>): Promise<any> {
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables }),
    });
    if (!response.ok) throw new Error(`GraphQL error: ${response.status}`);
    return response.json();
  }

  async searchProperties(attributes: Record<string, string> = {}): Promise<SartorProperty[]> {
    const attributeInputs = Object.entries(attributes).map(([field, value]) => ({ field, value }));

    const data = await this.query(PROPERTY_SEARCH_QUERY, {
      agencyIds: [1, 2],
      limit: 200,
      attributes: attributeInputs.length > 0 ? attributeInputs : undefined,
    });

    return (data?.data?.propertySearch ?? []).map((p: any) => ({
      id: p.id,
      propertyType: p.propertyType,
      price: p.price,
      operationTypes: p.operationTypes,
      fullAddress: p.fullAddress,
      description: p.description,
      characteristics: p.characteristics ?? [],
      lat: p.lat,
      lng: p.lng,
    }));
  }

  private extractUserIntent(userText: string): Record<string, string> {
    const lower = userText.toLowerCase();
    const attrs: Record<string, string> = {};

    const wantsRent = /\b(alquiler|alquilar|alquilo|alquilamos)\b/.test(lower);
    const wantsBuy = /\b(venta|comprar|compra|vender|vendo|quiero comprar)\b/.test(lower);
    if (wantsRent && !wantsBuy) attrs.operationType = "rent";
    else if (wantsBuy && !wantsRent) attrs.operationType = "sell";

    const typeMap: Record<string, string> = {
      departamento: "apartment",
      casa: "house",
      "casa quinta|quinta": "quinta",
      terreno: "terrain",
      "local comercial|local": "salon",
      deposito: "warehouse",
      cochera: "parking",
      campo: "farm",
      country: "country_house",
      galpon: "shed",
      ph: "apartment",
      monoambiente: "apartment",
      duplex: "house",
    };
    for (const [keywords, type] of Object.entries(typeMap)) {
      if (keywords.split("|").some((kw) => lower.includes(kw))) {
        attrs.propertyType = type;
        break;
      }
    }

    const roomsMatch = lower.match(/(\d+)\s*(ambientes|dormitorios?|habitaciones?|cuartos?)/);
    if (roomsMatch) {
      attrs.ambientes = roomsMatch[1];
    }

    return attrs;
  }

  private formatProperties(properties: SartorProperty[], userText: string): string {
    if (properties.length === 0) return "";

    const lower = userText.toLowerCase();
    const typeLabel = lower.includes("alquiler") ? "ALQUILER" : lower.includes("venta") ? "VENTA" : "DISPONIBLES";

    let text = `\n\n---\n\nPROPIEDADES SARTOR INMOBILIARIA (${typeLabel}):\n\n`;

    properties.slice(0, 10).forEach((p, i) => {
      const chars = p.characteristics.map((c) => c.name);
      const hasPrice = p.price && p.price !== "0" && p.price !== "";

      text += `${i + 1}. ${p.fullAddress}\n`;
      if (hasPrice) text += `   Precio: ${p.price}\n`;
      if (chars.length > 0) text += `   Detalles: ${chars.join(", ")}\n`;
      text += `\n`;
    });

    if (properties.length > 10) {
      text += `... y ${properties.length - 10} propiedades más.\n`;
    }
    text += `\nTotal: ${properties.length} propiedades encontradas.`;

    return text;
  }

  async fetchData(userText: string): Promise<string> {
    const attributes = this.extractUserIntent(userText);
    let properties = await this.searchProperties(attributes);

    if (properties.length === 0 && Object.keys(attributes).length > 0) {
      properties = await this.searchProperties({});
    }

    return this.formatProperties(properties, userText);
  }
}

export const sartorGraphqlService = new SartorGraphqlService();
