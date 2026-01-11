import {
    CHAT_NAMESPACE,
    SERVER_EVENT_CHAT_CREATED,
    SERVER_EVENT_CHAT_DELETED,
    SERVER_EVENT_MESSAGE_DELETED,
    SERVER_EVENT_MESSAGE_EDITED,
    redisNotificationSchema,
} from '@chat-app/socket-shared';
import type {
    AppSocketServer,
    MessageDeletedPayload,
    MessageEditedPayload,
} from '@chat-app/socket-shared';
import type { ChatWithDetails } from '@chat-app/core';
import {
    REDIS_EVENT_MESSAGE_DELETED,
    REDIS_EVENT_NEW_CHAT,
    REDIS_EVENT_MESSAGE_EDITED,
    REDIS_EVENT_CHAT_DELETED,
} from '@chat-app/core';
import { getServerConfig, getNotificationSubscriber } from '@chat-app/server-shared';

const config = getServerConfig();

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
        // Используем пространство имен /chat
        const chatNamespace = io.of(CHAT_NAMESPACE);
        
        chatData.members.forEach(member => {
            if (member?.userId) {
                // ВАЖНО: Мы отправляем в комнату пользователя (member.userId), 
                // так как он еще может не быть подключен к комнате чата.
                chatNamespace.to(member.userId).emit(SERVER_EVENT_CHAT_CREATED, chatData);
                console.log(
                    `[Redis Handler] Emitted SERVER_EVENT_CHAT_CREATED to user ${member.userId} for new chat ${chatData.id}`
                );
            }
        });
    } else {
        console.warn('[Redis Handler] Invalid NEW_CHAT payload received:', data);
    }
}

/**
 * Обрабатывает уведомление об удалении чата.
 * @param io - Экземпляр сервера Socket.IO.
 * @param data - Полезная нагрузка уведомления.
 */
function handleChatDeleted(io: AppSocketServer, data: { chatId: string; memberIds: string[]; userId: string }) {
    const { chatId, memberIds, userId } = data;
    if (chatId && Array.isArray(memberIds)) {
        console.log(`[Redis Handler] Processing CHAT_DELETED for chat ${chatId}`);
        const chatNamespace = io.of(CHAT_NAMESPACE);
        
        memberIds.forEach(memberId => {
             // Отправляем всем участникам, чтобы они удалили чат из списка
             chatNamespace.to(memberId).emit(SERVER_EVENT_CHAT_DELETED, { chatId, userId });
        });
        
        console.log(`[Redis Handler] Emitted SERVER_EVENT_CHAT_DELETED to members of chat ${chatId}`);
    } else {
        console.warn('[Redis Handler] Invalid CHAT_DELETED payload received:', data);
    }
}

/**
 * Обрабатывает уведомление о редактировании сообщения.
 * @param io - Экземпляр сервера Socket.IO.
 * @param data - Полезная нагрузка уведомления.
 */
function handleMessageEdited(io: AppSocketServer, data: MessageEditedPayload) {
    const { chatId, id: messageId } = data;
    if (chatId && messageId) {
        console.log(
            `[Redis Handler] Processing MESSAGE_EDITED for message ${messageId} in chat ${chatId}`
        );
        // Отправляем всем в комнате (чате) обновленные данные (полный DisplayMessage)
        io.of(CHAT_NAMESPACE).to(chatId).emit(SERVER_EVENT_MESSAGE_EDITED, data);
        console.log(`[Redis Handler] Emitted SERVER_EVENT_MESSAGE_EDITED to room ${chatId}`);
    } else {
        console.warn('[Redis Handler] Invalid MESSAGE_EDITED payload received:', data);
    }
}

/**
 * Обрабатывает уведомление об удалении сообщения.
 * @param io - Экземпляр сервера Socket.IO.
 * @param data - Полезная нагрузка уведомления.
 */
function handleMessageDeleted(io: AppSocketServer, data: MessageDeletedPayload) {
    const { chatId, messageId } = data;
    if (chatId && messageId) {
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
                validationResult.error
            );
            return;
        }

        const payload = validationResult.data;

        // Теперь switch типобезопасен благодаря discriminated union
        switch (payload.type) {
            case REDIS_EVENT_NEW_CHAT:
                handleNewChat(io, payload.data);
                break;

            case REDIS_EVENT_CHAT_DELETED:
                handleChatDeleted(io, payload.data);
                break;

            case REDIS_EVENT_MESSAGE_EDITED:
                handleMessageEdited(io, payload.data);
                break;

            case REDIS_EVENT_MESSAGE_DELETED:
                handleMessageDeleted(io, payload.data);
                break;

            default:
                const exhaustiveCheck: never = payload;
                console.warn(`[Redis Handler] Unhandled event type: ${exhaustiveCheck}`);
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
