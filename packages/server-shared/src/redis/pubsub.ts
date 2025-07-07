import type Redis from 'ioredis';
import { getDefaultRedisClients } from './client';

// Получаем готовые клиенты для pub/sub
function getPubSubClients() {
    return getDefaultRedisClients();
}

/**
 * Публикует уведомление в Redis канал
 */
export async function publishNotification(channel: string, message: unknown): Promise<void> {
    try {
        const { pubClient } = getPubSubClients();
        const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
        await pubClient.publish(channel, messageStr);
        console.log(`[Redis PubSub] Published to channel ${channel}:`, message);
    } catch (error) {
        console.error(`[Redis PubSub] Error publishing to channel ${channel}:`, error);
        throw error;
    }
}

/**
 * Подписывается на Redis канал
 */
export function subscribeToChannel(
    channel: string,
    onMessage: (_channel: string, _message: string) => void,
    subscriber?: Redis
): void {
    const actualSubscriber = subscriber || getPubSubClients().notificationSubscriber;

    actualSubscriber.subscribe(channel, (err, count) => {
        if (err) {
            console.error(`[Redis PubSub] Failed to subscribe to channel ${channel}:`, err);
            return;
        }
        console.log(
            `[Redis PubSub] Subscribed to channel ${channel}. Total subscriptions: ${count}`
        );
    });

    actualSubscriber.on('message', onMessage);
}

/**
 * Отписывается от Redis канала
 */
export async function unsubscribeFromChannel(channel: string, subscriber?: Redis): Promise<void> {
    try {
        const actualSubscriber = subscriber || getPubSubClients().notificationSubscriber;
        await actualSubscriber.unsubscribe(channel);
        console.log(`[Redis PubSub] Unsubscribed from channel ${channel}`);
    } catch (error) {
        console.error(`[Redis PubSub] Error unsubscribing from channel ${channel}:`, error);
        throw error;
    }
}

// Экспорт готовых клиентов через функции для ленивой инициализации
export function getPubClient(): Redis {
    return getPubSubClients().pubClient;
}

export function getNotificationSubscriber(): Redis {
    return getPubSubClients().notificationSubscriber;
}

export function getSubClient(): Redis {
    return getPubSubClients().subClient;
}

// Обратная совместимость
export const pubClient = getPubClient();
export const notificationSubscriber = getNotificationSubscriber();
