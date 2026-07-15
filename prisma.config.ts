import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    // Fallback placeholder: `prisma generate` (postinstall) NO conecta a la base,
    // solo necesita que la URL exista para generar el cliente. Así el demo builda
    // en Vercel SIN DATABASE_URL. En runtime se usa el valor real si está seteado;
    // el cliente lazy (infrastructure/database/prisma.ts) solo falla si realmente
    // se consulta la base sin haberla configurado.
    url:
      process.env.DATABASE_URL ??
      "postgresql://placeholder:placeholder@localhost:5432/placeholder",
  },
});
