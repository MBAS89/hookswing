import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Railway PostgreSQL has aggressive idle timeouts and low connection limits.
// We append connection_limit to prevent pool exhaustion and SSL EOF errors.
const baseUrl = process.env.DATABASE_URL || '';
const separator = baseUrl.includes('?') ? '&' : '?';
const dbUrl = baseUrl
  ? `${baseUrl}${separator}connection_limit=5&pool_timeout=10`
  : baseUrl;

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasources: { db: { url: dbUrl } },
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
