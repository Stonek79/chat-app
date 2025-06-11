import { PrismaClient } from '@prisma/client';

// Создаем единственный экземпляр PrismaClient, чтобы избежать истощения пула соединений
const prisma = new PrismaClient();

export { prisma };
