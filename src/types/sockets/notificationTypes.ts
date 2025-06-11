import type { REDIS_EVENT_MESSAGE_DELETED, REDIS_EVENT_NEW_CHAT } from '@/constants';

import type { ClientChat } from '../chat';
import type { MessageDeletedPayload } from '../message';

/**
 * @description Payload для события 'NEW_CHAT', публикуемого в Redis.
 * Содержит полный объект чата для клиента и ID пользователя-инициатора.
 */
export interface NewChatNotificationPayload {
    chatData: ClientChat;
    initiatorUserId: string;
}

/**
 * @description Полный объект уведомления 'NEW_CHAT'.
 */
export interface NewChatNotification {
    type: typeof REDIS_EVENT_NEW_CHAT;
    data: NewChatNotificationPayload;
}

/**
 * @description Полный объект уведомления 'MESSAGE_DELETED'.
 */
export interface MessageDeletedNotification {
    type: typeof REDIS_EVENT_MESSAGE_DELETED;
    data: MessageDeletedPayload;
}

/**
 * @description Discriminated union для всех возможных уведомлений, передаваемых через Redis.
 * Обеспечивает типобезопасную обработку различных типов уведомлений.
 */
export type RedisNotification = NewChatNotification | MessageDeletedNotification;
