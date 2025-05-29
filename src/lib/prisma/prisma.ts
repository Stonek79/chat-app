import { PrismaClient } from '@prisma/client';

/**
 * Модуль для инициализации и экспорта клиента Prisma.
 * Обеспечивает единую точку доступа к Prisma Client в приложении,
 * а также оптимизирует его использование в среде разработки (предотвращает создание множества инстансов).
 */

export const prisma = new PrismaClient();
