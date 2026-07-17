import type { DataProvider } from "@/assistants/_contract";

const GRAPHQL_ENDPOINT = "https://api.inmanager.com.ar/graphql";
const SARTOR_WEB = "https://sartorinmobiliaria.com";

const PROPERTY_SEARCH_QUERY = `
query propertySearch($agencyIds: [ID!], $per: Int, $attributes: PropertySearchInput) {
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
    // Handles: "hasta 600mil", "maximo 600", "maximo de 600mil", "presupuesto maximo de 600", etc.
    const priceMatch = lower.match(
      /(?:hasta|maximo\s*de|máximo\s*de|maximo|máximo|menos de|presupuesto(?:\s+maximo|\s+máximo)?(?:\s+de)?)\s*\$?\s*([\d.]+)\s*(mil|millón|millones)?/i
    );
    if (priceMatch) {
      let val = parseFloat(priceMatch[1].replace(/\./g, ""));
      const suffix = (priceMatch[2] || "").toLowerCase();
      if (suffix === "mil") val *= 1000;
      else if (suffix === "millón" || suffix === "millones") val *= 1000000;
      attrs.maxPrice = String(val);
    }

    const minMatch = lower.match(
      /(?:desde|minimo|mínimo|mas de|más de)\s*\$?\s*([\d.]+)\s*(mil|millón|millones)?/i
    );
    if (minMatch) {
      let val = parseFloat(minMatch[1].replace(/\./g, ""));
      const suffix = (minMatch[2] || "").toLowerCase();
      if (suffix === "mil") val *= 1000;
      else if (suffix === "millón" || suffix === "millones") val *= 1000000;
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
    const lower = userText.toLowerCase();

    // Determinar si busca alquiler o venta
    const buscaAlquiler = /\b(alquiler|alquilar|alquilo|alquilamos|alquilando)\b/.test(lower);
    const buscaVenta = /\b(venta|comprar|compra|vender|vendo)\b/.test(lower);

    let output = `PROPIEDADES `;
    output += buscaAlquiler ? `EN ALQUILER` : buscaVenta ? `EN VENTA` : `DISPONIBLES`;
    output += ` (total: ${properties.length}):`;

    // Mostrar hasta 8 propiedades
    properties.slice(0, 8).forEach((p, i) => {
      const chars = p.characteristics;
      const dormitorios = this.getChar(chars, "Dormitorios");
      const ambientes = this.getChar(chars, "Ambientes");
      const supCubierta = this.getChar(chars, "Superficie cubierta");
      const cocheraRaw = this.getChar(chars, "Cochera");

      output += `\n${i + 1}) ${p.fullAddress}. Precio: ${p.price || "consultar"}.`;
      if (dormitorios) output += ` ${dormitorios} dormitorios.`;
      if (ambientes) output += ` ${ambientes} ambientes.`;
      if (supCubierta && supCubierta !== "0") output += ` ${supCubierta} m² cubiertos.`;
      output += cocheraRaw === "1" ? " Tiene cochera." : " Sin cochera.";
      output += ` Link: ${SARTOR_WEB}/propiedad?id=${p.id}`;
    });

    if (properties.length > 8) {
      output += `\n... y ${properties.length - 8} propiedades más.`;
    }

    return output;
  }

  async fetchData(userText: string): Promise<string> {
    const attributes = this.extractUserIntent(userText);
    let properties = await this.searchProperties(attributes);

    // Si no hay resultados con filtros o el usuario no pidió nada específico,
    // devolver propiedades generales (siempre hay algo para mostrar)
    if (properties.length === 0) {
      properties = await this.searchProperties({});
    }

    return this.buildFetchDataOutput(properties, userText);
  }
}

export const sartorGraphqlService = new SartorGraphqlService();
