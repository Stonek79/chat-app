import { PrismaClient } from '@prisma/client';

/**
 * Модуль для инициализации и экспорта клиента Prisma.
 * Обеспечивает единую точку доступа к Prisma Client в приложении,
 * а также оптимизирует его использование в среде разработки (предотвращает создание множества инстансов).
 */

const prismaClientSingleton = () => {
    return new PrismaClient();
};

declare global {
    // eslint-disable-next-line no-unused-vars
    var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

export const prisma = globalThis.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma;
