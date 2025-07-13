import type Redis from 'ioredis';
import { getRedisClient, getNotificationSubscriber } from './client';

/**
 * Публикует уведомление в Redis канал
 */
export async function publishNotification(channel: string, message: unknown): Promise<void> {
    try {
        const pubClient = getRedisClient();
        const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
        await pubClient.publish(channel, messageStr);
        // console.log(`[Redis PubSub] Published to channel ${channel}:`, message);
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
    const actualSubscriber = subscriber || getNotificationSubscriber();

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
        const actualSubscriber = subscriber || getNotificationSubscriber();
        await actualSubscriber.unsubscribe(channel);
        console.log(`[Redis PubSub] Unsubscribed from channel ${channel}`);
    } catch (error) {
        console.error(`[Redis PubSub] Error unsubscribing from channel ${channel}:`, error);
        throw error;
    }
}
