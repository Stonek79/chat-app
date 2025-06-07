'use server';

import IORedis from 'ioredis';
import type { RedisOptions } from 'ioredis';

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
    console.error(
        'CRITICAL: Missing REDIS_URL environment variable. Redis clients will not be initialized.'
    );
    // В зависимости от критичности Redis для Next.js части, можно выбросить ошибку
    // throw new Error('CRITICAL: Missing REDIS_URL environment variable.');
}

const defaultRedisOptions: RedisOptions = {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    // Опции для переподключения (ioredis управляет этим по умолчанию, но можно настроить)
    // retryStrategy: (times) => {
    //   const delay = Math.min(times * 50, 2000);
    //   return delay;
    // },
    // tls: redisUrl && !redisUrl.includes('localhost') ? { rejectUnauthorized: false } : undefined, // Пример для TLS
};

let redisClient: IORedis | null = null;
let redisPublisher: IORedis | null = null;
let redisSubscriber: IORedis | null = null;

if (redisUrl) {
    redisClient = new IORedis(redisUrl, defaultRedisOptions);
    redisPublisher = new IORedis(redisUrl, {
        ...defaultRedisOptions,
        connectionName: 'nextjs-publisher',
    }); // Отдельный клиент для публикации
    redisSubscriber = new IORedis(redisUrl, {
        ...defaultRedisOptions,
        connectionName: 'nextjs-subscriber',
    }); // Отдельный клиент для подписки

    const clients = [
        { name: 'NextJS Main RedisClient', client: redisClient },
        { name: 'NextJS Redis Publisher', client: redisPublisher },
        { name: 'NextJS Redis Subscriber', client: redisSubscriber },
    ];

    clients.forEach(({ name, client }) => {
        if (client) {
            client.on('connect', () => {
                console.log(`Successfully connected ${name} to Redis.`);
            });

            client.on('error', err => {
                console.error(`${name} connection error:`, err);
            });

            client.on('ready', () => {
                console.log(`${name} is ready.`);
            });

            client.on('reconnecting', (delay: number) => {
                console.log(`${name} is reconnecting in ${delay}ms...`);
            });

            client.on('end', () => {
                console.log(`${name} connection ended.`);
            });
        }
    });
} else {
    console.warn(
        'Redis clients (redisClient, redisPublisher, redisSubscriber) for Next.js are not initialized due to missing REDIS_URL.'
    );
}

// Экспортируем инициализированные клиенты.
// Они будут null, если REDIS_URL не был предоставлен.
// export { redisClient, redisPublisher, redisSubscriber }; // Старый экспорт

export async function getRedisClient(): Promise<IORedis | null> {
    return redisClient;
}

export async function getRedisPublisher(): Promise<IORedis | null> {
    return redisPublisher;
}

export async function getRedisSubscriber(): Promise<IORedis | null> {
    return redisSubscriber;
}

// Для использования:
// 1. Убедитесь, что ваш REDIS_URL корректно указан в переменных окружения для Next.js приложения.
//    Например: REDIS_URL="redis://localhost:6379"
// 2. npm install ioredis
// 3. Для импорта в других частях приложения Next.js:
//    import { redisClient, redisPublisher, redisSubscriber } from '@/lib';

// redis.ts теперь является основным файлом, содержащим логику.
// index.ts в этой же директории будет просто реэкспортировать эти клиенты.
// Это позволит использовать импорт вида '@/lib'.
