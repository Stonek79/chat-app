import {
    CHAT_NAMESPACE,
    SERVER_EVENT_CHAT_CREATED,
    SERVER_EVENT_MESSAGE_DELETED,
    messageDeletedPayloadSchema,
} from '@chat-app/socket-shared';
import type { AppSocketServer, MessageDeletedPayload } from '@chat-app/socket-shared';
import type { ChatWithDetails } from '@chat-app/core';
import {
    REDIS_EVENT_MESSAGE_DELETED,
    REDIS_EVENT_NEW_CHAT,
    chatWithDetailsSchema,
} from '@chat-app/core';
import { getNotificationSubscriber, serverConfig as config } from '@chat-app/server-shared';
import { z } from 'zod';

const newChatNotificationSchema = z.object({
    type: z.literal(REDIS_EVENT_NEW_CHAT),
    data: chatWithDetailsSchema,
});

const messageDeletedNotificationSchema = z.object({
    type: z.literal(REDIS_EVENT_MESSAGE_DELETED),
    data: messageDeletedPayloadSchema,
});

const redisNotificationSchema = z.discriminatedUnion('type', [
    newChatNotificationSchema,
    messageDeletedNotificationSchema,
]);

/**
 * Обрабатывает уведомление о создании нового чата.
 * @param io - Экземпляр сервера Socket.IO.
 * @param data - Полезная нагрузка уведомления.
 */
function handleNewChat(io: AppSocketServer, data: ChatWithDetails) {
    const chatData = data;
    // Проверки на null/undefined здесь уже не нужны так строго, как раньше,
    // если мы доверяем источнику данных (например, API, который тоже использует Zod-схемы).
    // Но для надежности можно оставить.
    if (chatData?.id && Array.isArray(chatData.members)) {
        console.log(`[Redis Handler] Processing NEW_CHAT for chat ${chatData.id}`);
        const chatNamespace = io.of(CHAT_NAMESPACE);
        chatData.members.forEach(member => {
            if (member?.id) {
                chatNamespace.to(member.id).emit(SERVER_EVENT_CHAT_CREATED, chatData);
                console.log(
                    `[Redis Handler] Emitted SERVER_EVENT_CHAT_CREATED to user ${member.id} for new chat ${chatData.id}`
                );
            }
        });
    } else {
        console.warn('[Redis Handler] Invalid NEW_CHAT payload received:', data);
    }
}

/**
 * Обрабатывает уведомление об удалении сообщения.
 * @param io - Экземпляр сервера Socket.IO.
 * @param data - Полезная нагрузка уведомления.
 */
function handleMessageDeleted(io: AppSocketServer, data: MessageDeletedPayload) {
    const { chatId, messageId, deletedAt } = data;
    if (chatId && messageId && deletedAt) {
        console.log(
            `[Redis Handler] Processing MESSAGE_DELETED for message ${messageId} in chat ${chatId}`
        );
        io.of(CHAT_NAMESPACE).to(chatId).emit(SERVER_EVENT_MESSAGE_DELETED, data);
        console.log(`[Redis Handler] Emitted SERVER_EVENT_MESSAGE_DELETED to room ${chatId}`);
    } else {
        console.warn('[Redis Handler] Invalid MESSAGE_DELETED payload received:', data);
    }
}

/**
 * Главный обработчик сообщений из канала Redis.
 * Парсит, валидирует (неявно через приведение типа) и направляет в нужный обработчик.
 * @param io - Экземпляр сервера Socket.IO.
 * @param channel - Имя канала.
 * @param message - Сообщение (строка JSON).
 */
function onMessage(io: AppSocketServer, channel: string, message: string) {
    try {
        console.log(`[Redis Handler] Received message from channel ${channel}: ${message}`);
        const parsedJson = JSON.parse(message);
        const validationResult = redisNotificationSchema.safeParse(parsedJson);

        if (!validationResult.success) {
            console.warn(
                `[Redis Handler] Invalid notification payload received. Error:`,
                validationResult.error.flatten()
            );
            return;
        }

        const payload = validationResult.data;

        // Теперь switch типобезопасен благодаря discriminated union
        switch (payload.type) {
            case REDIS_EVENT_NEW_CHAT:
                handleNewChat(io, payload.data);
                break;

            case REDIS_EVENT_MESSAGE_DELETED:
                handleMessageDeleted(io, payload.data);
                break;
        }
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        console.error(
            `[Redis Handler] Error parsing or processing message: ${errorMessage}. Raw message: "${message}"`
        );
    }
}

/**
 * Инициализирует подписчика на канал уведомлений в Redis.
 * @param io - Экземпляр сервера Socket.IO, который будет использоваться для отправки событий клиентам.
 */
export function initializeNotificationListener(io: AppSocketServer) {
    const channel = config.REDIS_SOCKET_NOTIFICATIONS_CHANNEL;
    const notificationSubscriber = getNotificationSubscriber();

    notificationSubscriber.subscribe(channel, (err, count) => {
        if (err) {
            return console.error(
                `[Redis Handler] Failed to subscribe to Redis channel ${channel}:`,
                err
            );
        }
        if (typeof count === 'number' && count > 0) {
            console.log(
                `[Redis Handler] Successfully subscribed to channel: ${channel}. Subscriptions: ${count}`
            );
        }
    });

    notificationSubscriber.on('message', (ch, msg) => onMessage(io, ch, msg));

    console.log('[Redis Handler] Notification listener initialized.');
}
