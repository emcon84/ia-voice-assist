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

interface SartorImage {
  url: string;
  thumbUrl: string;
  smallUrl: string;
}

interface SartorCharacteristic {
  name: string;
}

export interface SartorProperty {
  id: string;
  propertyType: string;
  price: string;
  operationTypes: string[];
  fullAddress: string;
  description: string;
  images: SartorImage[];
  characteristics: SartorCharacteristic[];
  lat?: number;
  lng?: number;
}

interface PropertyAttributeInput {
  field: string;
  value: string;
}

import type { DataProvider } from "@/assistants/_contract";

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
    const attributeInputs: PropertyAttributeInput[] = Object.entries(attributes).map(
      ([field, value]) => ({ field, value })
    );

    const data = await this.query(PROPERTY_SEARCH_QUERY, {
      agencyIds: [1, 2],
      limit: 200,
      attributes: attributeInputs.length > 0 ? attributeInputs : undefined,
    });

    const results: SartorProperty[] =
      data?.data?.propertySearch?.map((p: any) => ({
        id: p.id,
        propertyType: p.propertyType,
        price: p.price,
        operationTypes: p.operationTypes,
        fullAddress: p.fullAddress,
        description: p.description,
        images: p.images ?? [],
        characteristics: p.characteristics ?? [],
        lat: p.lat,
        lng: p.lng,
      })) ?? [];

    return results;
  }

  async fetchData(userText: string): Promise<string> {
    const wantRent = /alquiler|alquilar|alquilo/i.test(userText);
    const wantSell = /venta|comprar|compra/i.test(userText);

    const attributes: Record<string, string> = {};
    if (wantRent && !wantSell) attributes.operationType = "rent";
    if (wantSell && !wantRent) attributes.operationType = "sell";

    const typeMap: Record<string, string> = {
      departamento: "apartment",
      casa: "house",
      "casa quinta": "quinta",
      terreno: "terrain",
      local: "salon",
      deposito: "warehouse",
      cochera: "parking",
      campo: "farm",
      country: "country_house",
      galpon: "shed",
    };
    for (const [kw, type] of Object.entries(typeMap)) {
      if (userText.toLowerCase().includes(kw)) {
        attributes.propertyType = type;
        break;
      }
    }

    const properties = await this.searchProperties(attributes);

    if (properties.length === 0) return "";

    const typeLabel =
      attributes.operationType === "rent"
        ? "ALQUILER"
        : attributes.operationType === "sell"
          ? "VENTA"
          : "TODAS";

    let text = `\n\n---\n\nPROPIEDADES ACTUALES DE SARTOR INMOBILIARIA (${typeLabel}):\n\n`;

    properties.slice(0, 10).forEach((p, i) => {
      const typeName = this.translateType(p.propertyType);
      text += `${i + 1}. ${p.fullAddress} — ${p.price}\n`;
      text += `   Tipo: ${typeName}\n`;
      if (p.characteristics?.length) {
        text += `   Características: ${p.characteristics.map((c) => c.name).join(", ")}\n`;
      }
      text += `   Link: https://sartorinmobiliaria.com/propiedades\n`;
      text += `\n`;
    });

    text += `\nTotal de propiedades encontradas: ${properties.length}.`;

    return text;
  }

  private translateType(type: string): string {
    const map: Record<string, string> = {
      apartment: "Departamento",
      house: "Casa",
      terrain: "Terreno",
      salon: "Local comercial",
      country_house: "Casa Quinta",
      farm: "Campo",
      parking: "Cochera",
      quinta: "Quinta",
      shed: "Galpón",
      warehouse: "Depósito",
    };
    return map[type] ?? type;
  }
}

export const sartorGraphqlService = new SartorGraphqlService();
