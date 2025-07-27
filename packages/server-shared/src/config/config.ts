// import 'dotenv/config';
import { z } from 'zod';
import { DEFAULT_SERVER_CONFIG } from '@chat-app/core';

// Ленивая загрузка dotenv только при необходимости
// function loadDotEnv() {
//     try {
//         import('dotenv/config');
//     } catch {
//         // В Docker или production dotenv может отсутствовать
//     }
// }

// Серверная конфигурация (содержит секреты и серверные настройки)
const serverEnvSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default(DEFAULT_SERVER_CONFIG.NODE_ENV),
    DATABASE_URL: z.string().url().optional(), // Делаем опциональным для build-time
    DATABASE_URL_REPLICA: z.string().url().optional(),
    JWT_SECRET: z.string().min(32, 'JWT_SECRET должен содержать не менее 32 символов'),
    REDIS_HOST: z.string().min(1).default(DEFAULT_SERVER_CONFIG.REDIS_HOST),
    REDIS_PORT: z.coerce.number().int().positive().default(DEFAULT_SERVER_CONFIG.REDIS_PORT),
    REDIS_PASSWORD: z.string().optional(),
    REDIS_SOCKET_NOTIFICATIONS_CHANNEL: z
        .string()
        .min(1)
        .default(DEFAULT_SERVER_CONFIG.REDIS_SOCKET_NOTIFICATIONS_CHANNEL),

    // Socket.IO серверные настройки
    SOCKET_PORT: z.coerce.number().int().positive().default(DEFAULT_SERVER_CONFIG.SOCKET_PORT),
    SOCKET_CORS_ORIGIN: z.string().min(1).default(DEFAULT_SERVER_CONFIG.SOCKET_CORS_ORIGIN),

    // Media Storage
    MEDIA_PUBLIC_URL: z.string().url().default(DEFAULT_SERVER_CONFIG.MEDIA_PUBLIC_URL),
    UPLOADS_PATH: z.string().min(1).default('/app/uploads'), // Путь внутри Docker контейнера
});

// Клиентская конфигурация (безопасная для отправки на клиент)
const clientEnvSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default(DEFAULT_SERVER_CONFIG.NODE_ENV),
    SOCKET_PORT: z.coerce.number().int().positive().default(DEFAULT_SERVER_CONFIG.SOCKET_PORT),
});

type ServerConfigRaw = z.infer<typeof serverEnvSchema>;
type ClientConfig = z.infer<typeof clientEnvSchema>;

// Итоговый тип с обязательным DATABASE_URL
type ServerConfig = ServerConfigRaw & {
    DATABASE_URL: string; // Всегда строка в runtime
};

let serverConfigInstance: ServerConfig;
let clientConfigInstance: ClientConfig;

function parseServerConfig(): ServerConfig {
    // Загружаем dotenv только при необходимости
    // loadDotEnv();

    const parsed = serverEnvSchema.safeParse(process.env);
    if (!parsed.success) {
        console.error(
            '❌ Ошибки валидации серверных переменных окружения:',
            parsed.error.flatten().fieldErrors
        );
        throw new Error('Некорректные серверные переменные окружения.');
    }

    const config = parsed.data;

    // Runtime проверка DATABASE_URL если используется Prisma
    if (process.env.NODE_ENV === 'production' && !config.DATABASE_URL) {
        throw new Error('DATABASE_URL is required in production');
    }

    // Приводим к правильному типу с обязательным DATABASE_URL
    return {
        ...config,
        DATABASE_URL: config.DATABASE_URL || process.env.DATABASE_URL || '',
    } as ServerConfig;
}

function parseClientConfig(): ClientConfig {
    const parsed = clientEnvSchema.safeParse(process.env);
    if (!parsed.success) {
        console.error(
            '❌ Ошибки валидации клиентских переменных окружения:',
            parsed.error.flatten().fieldErrors
        );
        throw new Error('Некорректные клиентские переменные окружения.');
    }
    return parsed.data;
}

export function getServerConfig(): ServerConfig {
    if (!serverConfigInstance) {
        serverConfigInstance = parseServerConfig();
    }
    return serverConfigInstance;
}

export function getClientConfig(): ClientConfig {
    if (!clientConfigInstance) {
        clientConfigInstance = parseClientConfig();
    }
    return clientConfigInstance;
}

export type { ServerConfig, ClientConfig };
