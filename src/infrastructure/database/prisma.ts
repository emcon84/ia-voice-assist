import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL is required');
  }

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);

  return new PrismaClient({ adapter });
}

// Instanciación LAZY: el cliente (y la validación de DATABASE_URL) se difiere
// hasta el PRIMER uso real. Importar este módulo NO rompe nada.
//
// Por qué: next build evalúa TODAS las rutas al compilar. Si el cliente se
// creara al importar, cualquier ruta que importe prisma tiraría el build cuando
// no hay DATABASE_URL. El demo (que no toca la base) despliega sin Postgres; el
// error solo aparece si realmente se consulta la base sin haberla configurado.
function getPrisma(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
}

const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrisma();
    const value = (client as unknown as Record<string | symbol, unknown>)[prop];
    return typeof value === 'function' ? value.bind(client) : value;
  },
});

export default prisma;
