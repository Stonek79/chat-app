import Redis, { Redis as RedisClientType } from 'ioredis';
import { getServerConfig } from '../config';

let mainClient: RedisClientType | null = null;
let subClientInstance: RedisClientType | null = null;
let notificationSubscriberInstance: RedisClientType | null = null;

function createClient(): RedisClientType {
    console.log('Creating new Redis client...');
    const config = getServerConfig();
    const client = new Redis({
        host: config.REDIS_HOST,
        port: config.REDIS_PORT,
        password: config.REDIS_PASSWORD,
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
    });

    client.on('error', err => console.error('Redis Client Error', err.message));
    client.on('connect', () => console.log('Redis client connected.'));
    client.on('ready', () => console.log('Redis client is ready.'));
    client.on('reconnecting', () => console.log('Redis client is reconnecting...'));
    return client;
}

export const getRedisClient = (): RedisClientType => {
    if (!mainClient) {
        mainClient = createClient();
    }
    return mainClient;
};

export const getSubClient = (): RedisClientType => {
    if (!subClientInstance) {
        subClientInstance = getRedisClient().duplicate();
        subClientInstance.on('connect', () => console.log('[Redis] SubClient connected.'));
        subClientInstance.on('error', (err: Error) =>
            console.error('[Redis] SubClient Error:', err)
        );
    }
    return subClientInstance;
};

export const getNotificationSubscriber = (): RedisClientType => {
    if (!notificationSubscriberInstance) {
        notificationSubscriberInstance = getRedisClient().duplicate();
        notificationSubscriberInstance.on('connect', () =>
            console.log('[Redis] NotificationSubClient connected.')
        );
        notificationSubscriberInstance.on('error', (err: Error) =>
            console.error('[Redis] NotificationSubClient Error:', err)
        );
    }
    return notificationSubscriberInstance;
};

export const disconnectRedis = async (): Promise<void> => {
    const clients = [mainClient, subClientInstance, notificationSubscriberInstance];
    for (const client of clients) {
        if (client && client.status !== 'end') {
            await client.quit();
        }
    }
    mainClient = null;
    subClientInstance = null;
    notificationSubscriberInstance = null;
    console.log('All Redis clients disconnected.');
};
