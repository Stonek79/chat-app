import type { z } from 'zod';

import type {
    chatLastMessageSchema,
    clientChatParticipantSchema,
    clientChatSchema,
    createGroupChatSchema,
    createMessageSchema,
    createPrivateChatSchema,
    sendMessageSocketSchema,
} from '@/schemas';

import type {
    ClientMessageAction,
    Message,
    MessageContentType,
    MessageReadReceipt,
} from '../message';
import type { BasicUser } from '../user';

export type {
    Chat,
    ChatParticipantRole,
    ChatParticipant as PrismaChatParticipant,
} from '@prisma/client';

/**
 * @description Тип для валидации данных при создании нового группового чата.
 * Выводится из `createGroupChatSchema`.
 */
export type CreateGroupChatPayload = z.infer<typeof createGroupChatSchema>;

/**
 * @description Тип для валидации данных при создании личного чата (диалога).
 * Выводится из `createPrivateChatSchema`.
 */
export type CreatePrivateChatPayload = z.infer<typeof createPrivateChatSchema>;

/**
 * @description Тип для валидации данных при отправке нового сообщения.
 * Выводится из `createMessageSchema`.
 */
export type CreateMessagePayload = z.infer<typeof createMessageSchema>;

/**
 * @description Тип для payload при отправке сообщения через сокет.
 * Выводится из `sendMessageSocketSchema`.
 */
export type ClientSendMessagePayload = z.infer<typeof sendMessageSocketSchema>;

/**
 * @description Краткая информация о пользователе для отображения в списках, сообщениях и т.д.
 * Выводится из `clientChatParticipantSchema`.
 */
export type ClientChatParticipant = z.infer<typeof clientChatParticipantSchema>;

/**
 * @description Информация о последнем сообщении в чате для превью.
 * Выводится из `chatLastMessageSchema`.
 */
export type ChatLastMessage = z.infer<typeof chatLastMessageSchema>;

/**
 * @description Основной тип для представления чата на клиенте.
 * Выводится из `clientChatSchema`.
 */
export type ClientChat = z.infer<typeof clientChatSchema> & {
    // Опционально добавляем поле messages, которое не является частью основной DTO-схемы,
    // но может быть добавлено на клиенте после отдельного запроса.
    messages?: Message[];
};

/**
 * @description Тип для сообщения, передаваемого через сокет.
 * Используется в событии SERVER_EVENT_RECEIVE_MESSAGE.
 */
export interface SocketMessagePayload {
    id: string;
    chatId: string;
    content: string;
    contentType: MessageContentType;
    createdAt: Date;
    updatedAt: Date | null;
    sender: BasicUser;
    readReceipts: MessageReadReceipt[];
    actions: ClientMessageAction[];
    clientTempId?: string;
}

// Тип для сообщения в чате
export interface ChatMessage {
    id: string;
    chatId: string;
    sender: ClientChatParticipant;
    content: string;
    createdAt: Date;
    updatedAt?: Date | null;
    isOptimistic?: boolean; // Для UI, если сообщение еще не подтверждено сервером
    // Можно добавить реакции, статус прочтения и т.д.
}
