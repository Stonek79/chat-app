import Redis from 'ioredis';

export interface RedisClientConfig {
    host: string;
    port: number;
    password?: string;
    tls?: object;
    maxRetriesPerRequest?: number | null;
}

export interface RedisClients {
    pubClient: Redis;
    subClient: Redis;
    notificationSubscriber: Redis;
}

export function createRedisClients(config: RedisClientConfig): RedisClients {
    const redisOptions = {
        host: config.host,
        port: config.port,
        password: config.password,
        // Простое включение TLS, если хост не localhost
        tls: config.host !== 'localhost' ? {} : undefined,
        // Позволяет избежать падения сервера при недоступности Redis при старте
        maxRetriesPerRequest: config.maxRetriesPerRequest ?? null,
    };

    // Клиент для публикации (и для общих команд)
    const pubClient = new Redis(redisOptions);

    // Клиент для подписки
    const subClient = pubClient.duplicate();

    // Отдельный клиент для подписки на уведомления от бэкенда
    const notificationSubscriber = pubClient.duplicate();

    // Настройка логирования
    pubClient.on('connect', () => console.log('[Redis] PubClient connected.'));
    pubClient.on('error', (err: Error) => console.error('[Redis] PubClient Error:', err));

    subClient.on('connect', () => console.log('[Redis] SubClient connected.'));
    subClient.on('error', (err: Error) => console.error('[Redis] SubClient Error:', err));

    notificationSubscriber.on('connect', () =>
        console.log('[Redis] NotificationSubClient connected.')
    );
    notificationSubscriber.on('error', (err: Error) =>
        console.error('[Redis] NotificationSubClient Error:', err)
    );

    return {
        pubClient,
        subClient,
        notificationSubscriber,
    };
}

// Singleton клиенты
let redisClients: RedisClients | null = null;

export function getDefaultRedisClients(): RedisClients {
    if (!redisClients) {
        const config = {
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
            password: process.env.REDIS_PASSWORD,
        };
        redisClients = createRedisClients(config);
    }
    return redisClients;
}
