import type { ClientChat } from './chat';

// Типы для Redis уведомлений
export interface NewChatNotificationPayload {
    chatData: ClientChat;
}

export interface RedisNotification {
    type: string;
    data: NewChatNotificationPayload | Record<string, unknown>;
}
