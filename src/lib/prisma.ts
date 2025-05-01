import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const prisma = new PrismaClient({
    log: ['error', 'warn']
  });

  // Add middleware for connection handling
  prisma.$use(async (params, next) => {
    const retries = 3;
    let attempt = 0;
    
    while (attempt < retries) {
      try {
        return await next(params);
      } catch (error: any) {
        attempt++;
        
        if (attempt === retries) throw error;
        
        if (error?.message && (
          error.message.includes('Connection') || 
          error.message.includes('timeout') ||
          error.message.includes('prisma') ||
          error.message.includes('database')
        )) {
          console.warn(`Database operation failed (attempt ${attempt}/${retries}), retrying...`);
          await new Promise(r => setTimeout(r, 1000)); // 1 second delay
          continue;
        }
        
        throw error;
      }
    }
  });

  return prisma;
}

// Initialize Prisma Client
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Handle connection cleanup on shutdown
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
});
