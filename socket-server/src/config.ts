import { z } from 'zod';

const envSchema = z.object({
    SOCKET_PORT: z.coerce.number().int().positive().default(3001),
    SOCKET_CORS_ORIGIN: z.string().min(1).default('http://localhost:3000'),
    REDIS_HOST: z.string().min(1).default('localhost'),
    REDIS_PORT: z.coerce.number().int().positive().default(6379),
    REDIS_PASSWORD: z.string().optional(),
    REDIS_SOCKET_NOTIFICATIONS_CHANNEL: z.string().min(1).default('socket-notifications'),
    JWT_SECRET: z.string().min(12, 'JWT_SECRET должен содержать не менее 32 символов'),
});

// TODO сделать для продакшена нормальный JWT_SECRET
const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
    console.error(
        '❌ Ошибки валидации переменных окружения:',
        parsedEnv.error.flatten().fieldErrors
    );
    throw new Error('Некорректные переменные окружения.');
}

export const config = parsedEnv.data;
