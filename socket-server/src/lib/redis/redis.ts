import Redis from 'ioredis';
import { config } from '../../config';

const redisOptions = {
    host: config.REDIS_HOST,
    port: config.REDIS_PORT,
    password: config.REDIS_PASSWORD,
    // Простое включение TLS, если хост не localhost. В реальном проекте может потребоваться более сложная конфигурация.
    tls: config.REDIS_HOST !== 'localhost' ? {} : undefined,
    // Позволяет избежать падения сервера при недоступности Redis при старте
    maxRetriesPerRequest: null,
};

// Клиент для публикации (и для общих команд)
const pubClient = new Redis(redisOptions);

// Клиент для подписки
const subClient = pubClient.duplicate();

// Отдельный клиент для подписки на уведомления от бэкенда, чтобы не смешивать с адаптером
const notificationSubscriber = pubClient.duplicate();

pubClient.on('connect', () => console.log('[Redis] PubClient connected.'));
pubClient.on('error', (err: Error) => console.error('[Redis] PubClient Error:', err));

subClient.on('connect', () => console.log('[Redis] SubClient connected.'));
subClient.on('error', (err: Error) => console.error('[Redis] SubClient Error:', err));

notificationSubscriber.on('connect', () => console.log('[Redis] NotificationSubClient connected.'));
notificationSubscriber.on('error', (err: Error) =>
    console.error('[Redis] NotificationSubClient Error:', err)
);

export { pubClient, subClient, notificationSubscriber };
