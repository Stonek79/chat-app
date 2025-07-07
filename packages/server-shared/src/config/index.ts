import 'dotenv/config';
import { z } from 'zod';

// Серверная конфигурация (содержит секреты и серверные настройки)
const serverEnvSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    DATABASE_URL: z.string().url(),
    DATABASE_URL_REPLICA: z.string().url().optional(),
    JWT_SECRET: z.string().min(32, 'JWT_SECRET должен содержать не менее 32 символов'),
    REDIS_HOST: z.string().min(1).default('localhost'),
    REDIS_PORT: z.coerce.number().int().positive().default(6379),
    REDIS_PASSWORD: z.string().optional(),
    REDIS_SOCKET_NOTIFICATIONS_CHANNEL: z.string().min(1).default('socket-notifications'),

    // Socket.IO серверные настройки
    SOCKET_PORT: z.coerce.number().int().positive().default(3001),
    SOCKET_CORS_ORIGIN: z.string().min(1).default('http://localhost:3000'),
});

// Клиентская конфигурация (безопасная для отправки на клиент)
const clientEnvSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    SOCKET_PORT: z.coerce.number().int().positive().default(3001),
});

// Парсинг серверной конфигурации
const parsedServerEnv = serverEnvSchema.safeParse(process.env);

if (!parsedServerEnv.success) {
    console.error(
        '❌ Ошибки валидации серверных переменных окружения:',
        parsedServerEnv.error.flatten().fieldErrors
    );
    throw new Error('Некорректные серверные переменные окружения.');
}

// Парсинг клиентской конфигурации
const parsedClientEnv = clientEnvSchema.safeParse(process.env);

if (!parsedClientEnv.success) {
    console.error(
        '❌ Ошибки валидации клиентских переменных окружения:',
        parsedClientEnv.error.flatten().fieldErrors
    );
    throw new Error('Некорректные клиентские переменные окружения.');
}

export const serverConfig = parsedServerEnv.data;
export const clientConfig = parsedClientEnv.data;

// Типы для использования в других модулях
export type ServerConfig = typeof serverConfig;
export type ClientConfig = typeof clientConfig;
