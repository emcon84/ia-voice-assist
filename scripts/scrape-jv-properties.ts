// Scraper de propiedades de JV Inmobiliaria
// Usa la API REST de MyHome (WordPress) — el HTML se renderiza con Vue.js client-side,
// así que consumimos directamente el endpoint JSON interno.

const BASE = "https://jv-inmobiliaria.com";
const API = `${BASE}/wp-json/myhome/v1/estates`;

// Las config-key se obtienen de los listing-grid de cada página
const CONFIG_KEYS = [
  "MyHomeListing1784224639", // alquiler
  "MyHomeListing1784224735", // venta
  "MyHomeListing1784224736", // desarrollo
  "MyHomeListing1784224359", // home
];

interface EstateAttribute {
  name: string;
  slug: string;
  values: { name: string; value: string; slug: string }[];
}

interface EstateRaw {
  id: number;
  name: string;
  slug: string;
  excerpt: string;
  link: string;
  has_price: boolean;
  image: string;
  address: string;
  attributes: EstateAttribute[];
  price: { price: string; is_range: boolean }[];
}

interface JVProperty {
  title: string;
  price: string;
  location: string;
  address: string;
  type: "alquiler" | "venta" | "desarrollo";
  ambientes?: number;
  dormitorios?: number;
  banios?: number;
  description: string;
  url: string;
  image: string;
  propertyType: string;
}

function getAttr(attrs: EstateAttribute[], slug: string): string | undefined {
  const attr = attrs.find((a) => a.slug === slug);
  return attr?.values?.[0]?.name;
}

function parsePrice(raw: { price: string; is_range: boolean }[] | undefined): string {
  if (!raw || raw.length === 0) return "Consultar";
  return raw[0].price;
}

async function fetchAll(): Promise<JVProperty[]> {
  const seen = new Set<number>();
  const all: JVProperty[] = [];

  for (const key of CONFIG_KEYS) {
    const res = await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ config_key: key, limit: 200 }),
    });
    if (!res.ok) {
      console.warn(`  [${key}] HTTP ${res.status}, skipping`);
      continue;
    }
    const data: { results: EstateRaw[] } = await res.json();
    for (const e of data.results ?? []) {
      if (seen.has(e.id)) continue;
      seen.add(e.id);

      const offerType = getAttr(e.attributes, "offer-type") ?? "";
      const type: JVProperty["type"] =
        offerType.toLowerCase().includes("venta")
          ? "venta"
          : offerType.toLowerCase().includes("desarrollo")
            ? "desarrollo"
            : "alquiler";

      const propertyType = getAttr(e.attributes, "property-type") ?? "—";
      const city = getAttr(e.attributes, "city") ?? "—";
      const ambientesRaw = getAttr(e.attributes, "attribute_18");
      const dormitoriosRaw = getAttr(e.attributes, "bedrooms");
      const baniosRaw = getAttr(e.attributes, "bathrooms");

      all.push({
        title: e.name,
        price: parsePrice(e.price),
        location: city,
        address: e.address ?? "—",
        type,
        ambientes: ambientesRaw ? parseInt(ambientesRaw, 10) || undefined : undefined,
        dormitorios: dormitoriosRaw ? parseInt(dormitoriosRaw, 10) || undefined : undefined,
        banios: baniosRaw ? parseInt(baniosRaw, 10) || undefined : undefined,
        description: e.excerpt
          .replace(/<[^>]*>/g, "")
          .replace(/\s+/g, " ")
          .trim(),
        url: e.link,
        image: e.image ?? "",
        propertyType,
      });
    }
  }

  return all;
}

function buildTypeLabel(type: string): string {
  switch (type) {
    case "alquiler":
      return "ALQUILER";
    case "venta":
      return "VENTA";
    case "desarrollo":
      return "DESARROLLO";
    default:
      return type.toUpperCase();
  }
}

function formatText(properties: JVProperty[]): string {
  const lines: string[] = [
    "=== PROPIEDADES ACTUALES DE JV DESARROLLOS INMOBILIARIOS ===",
    "",
  ];

  const groups: Record<string, JVProperty[]> = {};
  for (const p of properties) {
    const key = buildTypeLabel(p.type);
    if (!groups[key]) groups[key] = [];
    groups[key].push(p);
  }

  for (const [typeLabel, props] of Object.entries(groups)) {
    lines.push(`${typeLabel}:`);
    props.forEach((p, i) => {
      lines.push(`${i + 1}. ${p.title} — ${p.price}`);
      lines.push(`   Ubicación: ${p.location}`);
      if (p.propertyType !== "—") lines.push(`   Tipo: ${p.propertyType}`);
      const details = [p.ambientes ? `${p.ambientes} ambientes` : ""].filter(Boolean).join(", ");
      const bed = p.dormitorios ? `${p.dormitorios} dorm` : "";
      const bath = p.banios ? `${p.banios} baños` : "";
      const detailLine = [details, bed, bath].filter(Boolean).join(", ");
      if (detailLine) lines.push(`   ${detailLine}`);
      lines.push(`   ${p.description}`);
      lines.push(`   Link: ${p.url}`);
      if (p.image) lines.push(`   Imagen: ${p.image}`);
      lines.push("");
    });
  }

  return lines.join("\n");
}

async function main() {
  console.log("Scrapeando propiedades de JV Inmobiliaria...");
  const properties = await fetchAll();
  console.log(`  → ${properties.length} propiedades encontradas`);

  const date = new Date().toISOString().split("T")[0];
  const propertiesJson = JSON.stringify(properties, null, 2);
  const formattedText = formatText(properties);


  // Build file manually to avoid nested template literal issues
  const lines: string[] = [
    `// Generated by scripts/scrape-jv-properties.ts`,
    `// Last updated: ${date}`,
    `// Source: ${BASE}`,
    ``,
    `export interface JVProperty {`,
    `  title: string;`,
    `  price: string;`,
    `  location: string;`,
    `  address: string;`,
    `  type: "alquiler" | "venta" | "desarrollo";`,
    `  ambientes?: number;`,
    `  dormitorios?: number;`,
    `  banios?: number;`,
    `  description: string;`,
    `  url: string;`,
    `  image: string;`,
    `  propertyType: string;`,
    `}`,
    ``,
    `export const JV_PROPERTIES: JVProperty[] = ${propertiesJson};`,
    ``,
    `export const JV_PROPERTIES_TEXT = \``,
    formattedText,
    `\`;`,
    ``,
  ];

  const tsCode = lines.join("\n");

  const outPath = new URL("../src/data/knowledge/jv-properties.ts", import.meta.url).pathname;
  await Bun.write(outPath, tsCode);
  console.log(`  → Archivo generado: ${outPath}`);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
