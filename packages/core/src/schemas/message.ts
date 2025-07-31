import { z } from 'zod';
import { MessageContentType, ActionType } from '@chat-app/db';
import { VALIDATION_MESSAGES, VALIDATION_RULES } from '../constants/validation';
import { clientUserSchema } from './user';

// Базовые схемы для сообщений
export const messageSchema = z.object({
    id: z.cuid(),
    chatId: z.cuid(),
    senderId: z.cuid(),
    content: z.string(),
    mediaUrl: z.url().nullable(),
    contentType: z.enum(MessageContentType),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
    isEdited: z.boolean(),
    isPinned: z.boolean(),
    status: z.string(),
    replyToMessageId: z.cuid().nullable(),
    forwardedFromMessageId: z.cuid().nullable(),
});

export const messageReadReceiptSchema = z.object({
    id: z.cuid(),
    messageId: z.cuid(),
    userId: z.cuid(),
    readAt: z.coerce.date(),
});

export const messageActionSchema = z.object({
    id: z.cuid(),
    createdAt: z.coerce.date(),
    messageId: z.cuid(),
    actorId: z.cuid(),
    type: z.enum(ActionType),
    newContent: z.string().nullable(),
});

// UI схемы для клиентских типов
export const messageReadReceiptInfoSchema = messageReadReceiptSchema.extend({
    user: z.object({
        id: z.cuid(),
        username: z.string(),
        email: z.email(),
        avatarUrl: z.string().nullable(),
        role: z.string(),
    }),
});

export const messageActionInfoSchema = messageActionSchema.extend({
    actor: clientUserSchema,
});

export const clientMessageActionSchema = messageActionInfoSchema;

export const replyInfoSchema = z
    .object({
        id: z.cuid(),
        content: z.string(),
        contentType: z.enum(MessageContentType),
        sender: z.object({
            id: z.cuid(),
            username: z.string(),
            avatarUrl: z.string().nullable(),
        }),
    })
    .optional();

export const displayMessageSchema = messageSchema.extend({
    sender: z.object({
        id: z.cuid(),
        username: z.string(),
        email: z.email(),
        avatarUrl: z.string().nullable(),
        role: z.string(),
    }),
    readReceipts: z.array(messageReadReceiptInfoSchema),
    actions: z.array(messageActionInfoSchema),
    replyTo: replyInfoSchema,
    isCurrentUser: z.boolean(),
});

// API схемы для отправки сообщений
export const sendMessageSchema = z
    .object({
        chatId: z.cuid(),
        content: z
            .string()
            .min(1, VALIDATION_MESSAGES.MESSAGE_EMPTY)
            .max(VALIDATION_RULES.MESSAGE.maxLength, VALIDATION_MESSAGES.MESSAGE_TOO_LONG),
        contentType: z.enum(MessageContentType),
        mediaUrl: z.url(VALIDATION_MESSAGES.INVALID_MEDIA_URL).optional(),
        replyToMessageId: z.cuid().optional(),
    })
    .refine(
        data => {
            // Для медиа сообщений URL обязателен
            if (data.contentType !== MessageContentType.TEXT && !data.mediaUrl) {
                return false;
            }
            // Для текстовых сообщений контент обязателен
            if (data.contentType === MessageContentType.TEXT && !data.content.trim()) {
                return false;
            }
            return true;
        },
        {
            message: VALIDATION_MESSAGES.INVALID_MESSAGE_PARAMS,
        }
    );

export const editMessageSchema = z.object({
    messageId: z.cuid(),
    content: z
        .string()
        .min(1, VALIDATION_MESSAGES.MESSAGE_EMPTY)
        .max(VALIDATION_RULES.MESSAGE.maxLength, VALIDATION_MESSAGES.MESSAGE_TOO_LONG),
});

export const forwardMessageSchema = z.object({
    messageId: z.cuid(),
    chatIds: z
        .array(z.cuid())
        .min(1, VALIDATION_MESSAGES.NO_CHATS_SELECTED)
        .max(10, VALIDATION_MESSAGES.TOO_MANY_CHATS_FOR_FORWARD),
});

// Схемы для статусов прочтения
export const markAsReadSchema = z.object({
    chatId: z.cuid(),
    messageId: z.cuid(),
});

// Схемы для поиска и фильтрации
export const messageSearchParamsSchema = z.object({
    chatId: z.cuid(),
    query: z.string().optional(),
    contentType: z.enum(MessageContentType).optional(),
    senderId: z.cuid().optional(),
    before: z.coerce.date().optional(),
    after: z.date().optional(),
    limit: z.number().int().min(1).max(100).default(50),
    offset: z.number().int().min(0).default(0),
});

export const messagePaginationParamsSchema = z.object({
    chatId: z.cuid(),
    limit: z.number().int().min(1).max(100).default(50),
    before: z.cuid().optional(),
    after: z.cuid().optional(),
});

// Схемы для системных сообщений
export const systemMessageTypeSchema = z.enum([
    'USER_JOINED',
    'USER_LEFT',
    'CHAT_CREATED',
    'CHAT_RENAMED',
    'PARTICIPANT_ADDED',
    'PARTICIPANT_REMOVED',
    'ROLE_CHANGED',
]);

export const systemMessageSchema = z.object({
    type: systemMessageTypeSchema,
    actorId: z.cuid(),
    targetUserId: z.cuid().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
});
