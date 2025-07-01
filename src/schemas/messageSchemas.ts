import { ActionType, MessageContentType } from '@prisma/client';
import { z } from 'zod';

import { basicUserSchema } from './userSchemas';

/**
 * Схема для enum MessageContentType из Prisma.
 */
export const messageContentTypeSchema = z.nativeEnum(MessageContentType);

/**
 * Схема для enum MessageActionType из Prisma.
 */
export const messageActionTypeSchema = z.nativeEnum(ActionType);


/**
 * Схема для актора действия над сообщением.
 */
export const messageActionActorSchema = z.object({
    id: z.string(),
    username: z.string(),
});

/**
 * Схема для действия над сообщением.
 */
export const messageActionSchema = z.object({
    id: z.string(),
    type: messageActionTypeSchema,
    createdAt: z.date(),
    actor: messageActionActorSchema,
});

/**
 * Схема для отметки о прочтении.
 */
export const readReceiptSchema = z.object({
    userId: z.string(),
    readAt: z.date().nullable(),
});

/**
 * @description Схема для отображения сообщения на клиенте (DisplayMessage).
 * Включает все необходимые для UI поля.
 */
export const displayMessageSchema = z.object({
    id: z.string(),
    content: z.string(),
    contentType: messageContentTypeSchema,
    mediaUrl: z.string().url().nullable(),
    createdAt: z.date(),
    updatedAt: z.date().nullable(),
    chatId: z.string(),
    sender: basicUserSchema,
    actions: z.array(messageActionSchema).optional(),
    readReceipts: z.array(readReceiptSchema).optional(),
    isCurrentUser: z.boolean(),
    isEdited: z.boolean(),
});

/**
 * @description Схема для валидации данных при отправке нового сообщения.
 */
export const createMessageSchema = z.object({
    content: z.string().min(1, { message: 'Сообщение не может быть пустым' }),
    chatId: z.string().cuid(),
});

/**
 * @description Схема для валидации payload при отправке сообщения через сокет.
 * Включает опциональный временный ID для UI.
 */
export const sendMessageSocketSchema = createMessageSchema.extend({
    clientTempId: z.string().uuid(),
    contentType: z.nativeEnum(MessageContentType).optional(),
});
