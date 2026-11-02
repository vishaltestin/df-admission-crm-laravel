import "dotenv/config"
import { PrismaMariaDb } from "@prisma/adapter-mariadb"
import { PrismaClient } from "@/generated/prisma/client"

function createPrismaClient() {
  const rawUrl =
    process.env.DATABASE_URL ||
    "mysql://crm_user:crm_password@127.0.0.1:3306/df_crm"
  const parsed = new URL(rawUrl)

  const adapter = new PrismaMariaDb({
    host: parsed.hostname || "127.0.0.1",
    port: parsed.port ? Number(parsed.port) : 3306,
    user: decodeURIComponent(parsed.username || "crm_user"),
    password: decodeURIComponent(parsed.password || "crm_password"),
    database: parsed.pathname.replace(/^\//, "") || "df_crm",
    connectionLimit: 10,
  })

  return new PrismaClient({ adapter })
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}
