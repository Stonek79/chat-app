import type { SendMessagePayload, DisplayMessage } from '@chat-app/core';

// Типы для пользовательских событий Socket.IO
export interface SocketUserPresencePayload {
    chatId: string;
    userId: string;
    email: string;
    username: string;
    avatarUrl: string;
    role: string;
}

export interface GeneralSocketErrorPayload {
    message: string;
    code: string;
}

// Типы для acknowledgement callbacks Socket.IO
export interface SendMessageAckResponse {
    success: boolean;
    messageId?: string;
    createdAt?: Date;
    error?: string;
}

// Типы для Socket.IO событий
export interface MessagesReadPayload {
    chatId: string;
    userId: string;
    lastReadMessageId: string;
    readAt: Date;
}

// Тип для клиентского сообщения с временным ID (Socket.IO специфичный)
export type ClientSendMessagePayload = SendMessagePayload & { clientTempId?: string };

// Типы для удаленных сообщений (Socket.IO специфичные)
export type MessageDeletedPayload = {
    messageId: string;
    chatId: string;
};

export interface ChatDeletedPayload {
    chatId: string;
    userId: string; // ID пользователя, который удалил чат
}

export type MessageEditedPayload = DisplayMessage;

export interface UserStatusChangedPayload {
    userId: string;
    isOnline: boolean;
    lastSeenAt: string | null; // ISO string when sent over JSON/socket
}

export interface TypingPayload {
    chatId: string;
    userId: string;
    username?: string; // Optional for display
}
