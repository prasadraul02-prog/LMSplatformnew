import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

const prismaClientSingleton = () => {
    // NOTE: For high traffic (e.g., 12k users), ensure your DATABASE_URL points to a connection pooler (like PgBouncer).
    // If using Vercel Postgres, Supabase, or Neon, connection pooling is often built-in or configurable.
    return new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
        datasources: {
            db: {
                url: process.env.DATABASE_URL
            },
        },
    })
}

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

