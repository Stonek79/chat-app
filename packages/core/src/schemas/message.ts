import { z } from 'zod';
import { MessageContentType, ActionType } from '@chat-app/db';
import { VALIDATION_MESSAGES, VALIDATION_RULES } from '../constants/validation';

// Базовые схемы для сообщений
export const messageSchema = z.object({
    id: z.string().cuid(),
    chatId: z.string().cuid(),
    senderId: z.string().cuid(),
    content: z.string(),
    mediaUrl: z.string().url().nullable(),
    contentType: z.nativeEnum(MessageContentType),
    createdAt: z.date(),
    updatedAt: z.date(),
    deletedAt: z.date().nullable(),
    isEdited: z.boolean(),
    status: z.string(),
    replyToMessageId: z.string().cuid().nullable(),
    forwardedFromMessageId: z.string().cuid().nullable(),
});

export const messageReadReceiptSchema = z.object({
    id: z.string().cuid(),
    messageId: z.string().cuid(),
    userId: z.string().cuid(),
    readAt: z.date(),
});

export const messageActionSchema = z.object({
    id: z.string().cuid(),
    createdAt: z.date(),
    messageId: z.string().cuid(),
    actorId: z.string().cuid(),
    type: z.nativeEnum(ActionType),
    newContent: z.string().nullable(),
});

// UI схемы для клиентских типов
export const messageReadReceiptInfoSchema = messageReadReceiptSchema.extend({
    user: z.object({
        id: z.string().cuid(),
        username: z.string(),
        email: z.string().email(),
        avatarUrl: z.string().url().nullable(),
        role: z.string(),
    }),
});

export const messageActionInfoSchema = messageActionSchema.extend({
    actor: z.object({
        id: z.string().cuid(),
        username: z.string(),
        email: z.string().email(),
        avatarUrl: z.string().url().nullable(),
        role: z.string(),
    }),
});

export const displayMessageSchema = messageSchema.extend({
    sender: z.object({
        id: z.string().cuid(),
        username: z.string(),
        email: z.string().email(),
        avatarUrl: z.string().url().nullable(),
        role: z.string(),
    }),
    readReceipts: z.array(messageReadReceiptInfoSchema),
    actions: z.array(messageActionInfoSchema),
    replyTo: z
        .object({
            id: z.string().cuid(),
            content: z.string(),
            contentType: z.nativeEnum(MessageContentType),
            sender: z.object({
                id: z.string().cuid(),
                username: z.string(),
                avatarUrl: z.string().url().nullable(),
            }),
        })
        .optional(),
    isCurrentUser: z.boolean(),
    canEdit: z.boolean(),
    canDelete: z.boolean(),
});

// API схемы для отправки сообщений
export const sendMessageSchema = z
    .object({
        chatId: z.string().cuid(),
        content: z
            .string()
            .min(1, VALIDATION_MESSAGES.MESSAGE_EMPTY)
            .max(VALIDATION_RULES.MESSAGE.maxLength, VALIDATION_MESSAGES.MESSAGE_TOO_LONG),
        contentType: z.nativeEnum(MessageContentType).default(MessageContentType.TEXT),
        mediaUrl: z.string().url(VALIDATION_MESSAGES.INVALID_MEDIA_URL).optional(),
        replyToMessageId: z.string().cuid().optional(),
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
    messageId: z.string().cuid(),
    content: z
        .string()
        .min(1, VALIDATION_MESSAGES.MESSAGE_EMPTY)
        .max(VALIDATION_RULES.MESSAGE.maxLength, VALIDATION_MESSAGES.MESSAGE_TOO_LONG),
});

export const deleteMessageSchema = z.object({
    messageId: z.string().cuid(),
});

export const forwardMessageSchema = z.object({
    messageId: z.string().cuid(),
    chatIds: z
        .array(z.string().cuid())
        .min(1, VALIDATION_MESSAGES.NO_CHATS_SELECTED)
        .max(10, VALIDATION_MESSAGES.TOO_MANY_CHATS_FOR_FORWARD),
});

// Схемы для статусов прочтения
export const markAsReadSchema = z.object({
    chatId: z.string().cuid(),
    messageId: z.string().cuid(),
});

// Схемы для поиска и фильтрации
export const messageSearchParamsSchema = z.object({
    chatId: z.string().cuid(),
    query: z.string().optional(),
    contentType: z.nativeEnum(MessageContentType).optional(),
    senderId: z.string().cuid().optional(),
    before: z.date().optional(),
    after: z.date().optional(),
    limit: z.number().int().min(1).max(100).default(50),
    offset: z.number().int().min(0).default(0),
});

export const messagePaginationParamsSchema = z.object({
    chatId: z.string().cuid(),
    limit: z.number().int().min(1).max(100).default(50),
    before: z.string().cuid().optional(),
    after: z.string().cuid().optional(),
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
    actorId: z.string().cuid(),
    targetUserId: z.string().cuid().optional(),
    metadata: z.record(z.unknown()).optional(),
});
