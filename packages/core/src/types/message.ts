import { z } from 'zod';
import type {
    Message,
    MessageReadReceipt,
    MessageAction,
    User,
    MessageContentType,
} from '@chat-app/db';
import {
    sendMessageSchema,
    editMessageSchema,
    deleteMessageSchema,
    markAsReadSchema,
    displayMessageSchema,
    messageReadReceiptInfoSchema,
    messageActionInfoSchema,
} from '../schemas/message';

// ОСНОВНЫЕ ТИПЫ (выведены из Zod схем - единый источник истины)
export type SendMessagePayload = z.infer<typeof sendMessageSchema>;
export type EditMessagePayload = z.infer<typeof editMessageSchema>;
export type DeleteMessagePayload = z.infer<typeof deleteMessageSchema>;
export type MarkAsReadPayload = z.infer<typeof markAsReadSchema>;

// UI ТИПЫ (выведены из схем)
export type DisplayMessage = z.infer<typeof displayMessageSchema>;
export type MessageReadReceiptInfo = z.infer<typeof messageReadReceiptInfoSchema>;
export type MessageActionInfo = z.infer<typeof messageActionInfoSchema>;

// ТИПЫ ДЛЯ SOCKET И API
export type MessagePayload = {
    id: string;
    chatId: string;
    content: string;
    contentType: MessageContentType;
    createdAt: Date;
    updatedAt: Date;
    sender: {
        id: string;
        username: string;
        avatarUrl: string | null;
        role: string;
        email: string;
    };
    readReceipts: MessageReadReceiptInfo[];
    actions: MessageActionInfo[];
    clientTempId?: string;
};

// Socket payload типы
export type SocketMessagePayload = MessagePayload;

export type ClientMessageAction = MessageActionInfo;

// ТИПЫ ДЛЯ БД (используем автоматически генерируемые из Prisma)
export type PrismaMessage = Message;

// ТИПЫ ДЛЯ МАППЕРОВ (четкие интерфейсы вместо сложных пересечений)
// Обновлены для соответствия новой Prisma схеме
export type MessageReadReceiptWithUser = MessageReadReceipt & { user: User };

export type MessageActionWithActor = MessageAction & { actor: User };

export type MessageWithSender = Message & { sender: User };

// Основной тип для отображения сообщений с новыми связями
export type PrismaMessageWithRelations = Message & {
    sender: User;
    readReceipts: MessageReadReceiptWithUser[];
    actions: MessageActionWithActor[];
    replyTo?: MessageWithSender | null;
    replies?: MessageWithSender[];
    forwardedFrom?: MessageWithSender | null;
    forwarded?: MessageWithSender[];
};

// Для обратной совместимости
export type PrismaMessageForDisplay = PrismaMessageWithRelations;
