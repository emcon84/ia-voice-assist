import type { DataProvider } from "@/assistants/_contract";

const GRAPHQL_ENDPOINT = "https://api.inmanager.com.ar/graphql";
const SARTOR_WEB = "https://sartorinmobiliaria.com";

const PROPERTY_SEARCH_QUERY = `
query propertySearch($agencyIds: [Int], $per: Int, $attributes: PropertySearchInput) {
  propertySearch(agencyIds: $agencyIds, per: $per, attributes: $attributes) {
    properties {
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
        value
      }
      address {
        city
        neighborhood
        street
      }
    }
  }
}
`;

interface PropertyImage {
  url: string;
  thumbUrl: string;
  smallUrl: string;
}

interface PropertyCharacteristic {
  name: string;
  value: string;
}

interface SartorProperty {
  id: string;
  propertyType: string;
  price: string;
  operationTypes: string[];
  fullAddress: string;
  description: string;
  images: PropertyImage[];
  characteristics: PropertyCharacteristic[];
  address: {
    city: string;
    neighborhood: string;
    street: string;
  };
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

  private imgUrl(path: string): string {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    return `${GRAPHQL_ENDPOINT.replace("/graphql", "")}${path}`;
  }

  private getChar(chars: PropertyCharacteristic[], name: string): string {
    return chars.find((c) => c.name.toLowerCase() === name.toLowerCase())?.value ?? "";
  }

  async searchProperties(attributes: Record<string, string> = {}): Promise<SartorProperty[]> {
    const data = await this.query(PROPERTY_SEARCH_QUERY, {
      agencyIds: [1, 2],
      per: 50,
      attributes: Object.keys(attributes).length > 0 ? attributes : undefined,
    });

    return data?.data?.propertySearch?.properties ?? [];
  }

  private extractUserIntent(userText: string): Record<string, string> {
    const lower = userText.toLowerCase();
    const attrs: Record<string, string> = {};

    // --- Operation type ---
    const wantsRent = /\b(alquiler|alquilar|alquilo|alquilamos|alquilando)\b/.test(lower);
    const wantsBuy = /\b(venta|comprar|compra|vender|vendo|quiero comprar|quiero vender|vende)\b/.test(lower);
    if (wantsRent && !wantsBuy) attrs.operationType = "rent";
    else if (wantsBuy && !wantsRent) attrs.operationType = "sell";

    // --- Property type ---
    const typeMap: Record<string, string> = {
      "departamento|ph|monoambiente|depto": "apartment",
      "casa|casa quinta|quinta|duplex": "house",
      "terreno|lote": "terrain",
      "local comercial|local|negocio": "salon",
      deposito: "warehouse",
      cochera: "parking",
      campo: "farm",
      "country|countries": "country_house",
      galpon: "shed",
    };
    for (const [keywords, type] of Object.entries(typeMap)) {
      if (keywords.split("|").some((kw) => lower.includes(kw))) {
        attrs.propertyType = type;
        break;
      }
    }

    // --- Price range ---
    const priceMatch = lower.match(
      /(?:hasta|maximo|máximo|menos de|hasta|presupuesto(?:\s+maximo|\s+máximo)?(?:\s+de)?)\s*\$?\s*([\d.]+)\s*(?:mil|k|\.000)?\s*(?:pesos)?(?:\s*por\s*mes)?/i
    );
    if (priceMatch) {
      let val = parseFloat(priceMatch[1].replace(/\./g, ""));
      if (priceMatch[0].includes("mil") && val < 1000) val *= 1000;
      attrs.maxPrice = String(val);
    }

    const minMatch = lower.match(
      /(?:desde|minimo|mínimo|mas de|más de)\s*\$?\s*([\d.]+)\s*(?:mil|k)?/i
    );
    if (minMatch) {
      let val = parseFloat(minMatch[1].replace(/\./g, ""));
      if (minMatch[0].includes("mil") && val < 1000) val *= 1000;
      attrs.minPrice = String(val);
    }

    // --- Neighborhood / zone ---
    const neighborhoods = [
      "barrio este", "barrio oeste", "barrio norte", "barrio sur",
      "centro", "4 bocas", "cuatro bocas", "los nogales",
      "san lorenzo", "santa rosa", "belgrano", "saavedra",
      "30 de octubre", "treinta de octubre",
    ];
    for (const hood of neighborhoods) {
      if (lower.includes(hood)) {
        attrs.neighborhood = hood;
        break;
      }
    }

    return attrs;
  }

  private formatCharValue(name: string, value: string): string {
    if (name === "Cochera") return value === "1" ? "Si" : value === "0" ? "No" : value;
    if (name === "Dormitorios" || name === "Ambientes" || name === "Baños") return value;
    if (name.includes("Superficie")) return value ? `${value} m²` : "";
    return value;
  }

  private buildFetchDataOutput(properties: SartorProperty[], userText: string): string {
    if (properties.length === 0) return "";

    const lower = userText.toLowerCase();
    const tipo = lower.includes("alquiler") ? "alquiler" : lower.includes("venta") ? "venta" : "disponibles";

    let output = `\n\nDATOS DEL SISTEMA (${tipo.toUpperCase()}):\n`;
    output += `Se encontraron ${properties.length} propiedades en ${tipo}.\n\n`;

    properties.slice(0, 10).forEach((p, i) => {
      const chars = p.characteristics;
      const dormitorios = this.getChar(chars, "Dormitorios");
      const ambientes = this.getChar(chars, "Ambientes");
      const supCubierta = this.getChar(chars, "Superficie cubierta");
      const cocheraRaw = this.getChar(chars, "Cochera");

      output += `${i + 1}. ${p.fullAddress}`;
      if (p.price) output += ` — ${p.price}`;
      if (dormitorios) output += ` — ${dormitorios}d`;
      if (ambientes) output += ` — ${ambientes}amb`;
      if (supCubierta && supCubierta !== "0") output += ` — ${supCubierta}m²`;
      output += cocheraRaw === "1" ? " — cochera" : "";
      output += `\n   Link: ${SARTOR_WEB}/propiedad?id=${p.id}\n`;
    });

    return output;
  }

  async fetchData(userText: string): Promise<string> {
    const attributes = this.extractUserIntent(userText);
    let properties = await this.searchProperties(attributes);

    // Si no hay resultados con filtros, intentar sin filtros
    if (properties.length === 0 && Object.keys(attributes).length > 0) {
      properties = await this.searchProperties({});
    }

    return this.buildFetchDataOutput(properties, userText);
  }
}

export const sartorGraphqlService = new SartorGraphqlService();
