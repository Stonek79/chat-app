/**
 * @file redis.ts
 * @description Константы, связанные с взаимодействием через Redis.
 */

/**
 * @description Канал в Redis для публикации уведомлений от API к сокет-серверу.
 * Это позволяет сокет-серверу реагировать на события, инициированные в других частях системы
 * (например, создание чата или удаление сообщения через REST API).
 */
export const REDIS_SOCKET_NOTIFICATIONS_CHANNEL = 'socket-notifications';

/**
 * @description Тип события, публикуемого в Redis при создании нового чата.
 */
export const REDIS_EVENT_NEW_CHAT = 'NEW_CHAT';

/**
 * @description Тип события, публикуемого в Redis при удалении сообщения.
 */
export const REDIS_EVENT_MESSAGE_DELETED = 'MESSAGE_DELETED';
