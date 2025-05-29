// src/lib/redis.ts
// import { createClient, RedisClientType } from 'redis';

/**
 * Модуль для инициализации и экспорта клиента Redis.
 * Будет использоваться для кэширования, Socket.IO pub/sub и других задач.
 */

import IORedis from 'ioredis';

// URL для подключения к Redis. Берется из переменных окружения.
// Пример: redis://localhost:6379 или redis://redis-user:redis-password@redis-host:6379
const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
    console.error(
        'CRITICAL: Missing REDIS_URL environment variable. Redis clients (pub/sub) will not be initialized. Socket.IO will likely not work correctly in a multi-instance setup.'
    );
    // Для чат-приложения с Socket.IO адаптером, Redis критичен.
    // Можно было бы выбросить ошибку, чтобы остановить запуск приложения,
    // если Redis абсолютно необходим для старта.
    // throw new Error('CRITICAL: Missing REDIS_URL environment variable.');
}

// Создаем основной клиент Redis.
// Опции можно расширить по необходимости (например, для обработки переподключений, таймаутов и т.д.)
// Типизация для опций берется из самого ioredis.
const redisOptions: import('ioredis').RedisOptions = {
    maxRetriesPerRequest: 3, // Ограничим количество попыток для команд
    enableReadyCheck: true, // Ждать готовности перед отправкой команд
    // Для TLS можно добавить:
    // tls: { rejectUnauthorized: false } // Зависит от вашей конфигурации Redis
    // Опции для переподключения (ioredis управляет этим по умолчанию, но можно настроить)
    // retryStrategy: (times) => {
    //   const delay = Math.min(times * 50, 2000); // example: 50ms, 100ms, 150ms ... up to 2s
    //   return delay;
    // },
};

let redisClient: IORedis | null = null;
let pubClient: IORedis | null = null;
let subClient: IORedis | null = null;

if (redisUrl) {
    redisClient = new IORedis(redisUrl, redisOptions);
    pubClient = new IORedis(redisUrl, redisOptions); // Отдельный клиент для публикации
    subClient = new IORedis(redisUrl, redisOptions); // Отдельный клиент для подписки

    const clients = [
        { name: 'main RedisClient', client: redisClient },
        { name: 'Redis PubClient', client: pubClient },
        { name: 'Redis SubClient', client: subClient },
    ];

    clients.forEach(({ name, client }) => {
        client.on('connect', () => {
            console.log(`Successfully connected ${name} to Redis.`);
        });

        client.on('error', err => {
            console.error(`${name} connection error:`, err);
            // Здесь можно добавить логику для обработки критических ошибок подключения
        });

        client.on('ready', () => {
            console.log(`${name} is ready.`);
        });

        client.on('reconnecting', () => {
            console.log(`${name} is reconnecting...`);
        });

        client.on('end', () => {
            console.log(`${name} connection ended.`);
        });
    });
} else {
    console.warn(
        'Redis clients (redisClient, pubClient, subClient) are not initialized due to missing REDIS_URL.'
    );
}

// Для Socket.IO адаптера обычно требуются два отдельных клиента: один для publish, другой для subscribe.
// ioredis позволяет использовать один и тот же инстанс для обеих операций, но для ясности
// и для совместимости с некоторыми адаптерами (например, @socket.io/redis-adapter)
// можно создать дублирующие подключения или использовать один клиент, если адаптер это поддерживает.
// На данном этапе экспортируем один основной клиент.
// Если адаптер потребует отдельные клиенты, их можно создать здесь же:
// export const publisher = redisUrl ? new IORedis(redisUrl, redisOptions) : null;
// export const subscriber = redisUrl ? new IORedis(redisUrl, redisOptions) : null;

// Убедитесь, что publisher и subscriber (если используются) также имеют обработчики 'connect' и 'error'.

export { redisClient, pubClient, subClient };

// Для использования:
// 1. Убедитесь, что ваш REDIS_URL корректно указан в переменных окружения.
// 2. npm install ioredis

// Для использования реального клиента:
// 1. Раскомментируйте код выше.
// 2. Установите зависимость: npm install redis
// 3. Убедитесь, что ваш REDIS_URL корректно указан в переменных окружения.
