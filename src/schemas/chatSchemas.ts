import { ChatParticipantRole, MessageContentType } from '@prisma/client';
import { z } from 'zod';

import { validationMessages } from '@/constants';

import { displayMessageSchema } from './messageSchemas';
import { basicUserSchema } from './userSchemas';

// Константы для валидации
const CHAT_NAME_MAX_LENGTH = 100;

/**
 * @description Схема для валидации данных при создании нового группового чата.
 */
export const createGroupChatSchema = z.object({
    name: z
        .string()
        .min(1, { message: validationMessages.required })
        .max(CHAT_NAME_MAX_LENGTH, {
            message: validationMessages.chatNameLength(CHAT_NAME_MAX_LENGTH),
        }),
    memberIds: z
        .array(z.string().uuid())
        .min(1, { message: 'В групповом чате должен быть хотя бы один участник' }),
});

/**
 * @description Схема для валидации данных при создании личного чата (диалога).
 */
export const createPrivateChatSchema = z.object({
    recipientId: z.string().uuid(),
});

/**
 * Схема для enum ChatParticipantRole из Prisma.
 */
export const chatParticipantRoleSchema = z.nativeEnum(ChatParticipantRole);

export const clientChatParticipantSchema = basicUserSchema.extend({
    role: chatParticipantRoleSchema,
});

export const chatLastMessageSchema = displayMessageSchema.extend({});

/**
 * @description Основная схема для представления чата на клиенте (DTO).
 * Включает участников, последнее сообщение и другую мета-информацию.
 */
export const clientChatSchema = z.object({
    id: z.string().cuid(),
    name: z.string().nullable(),
    isGroupChat: z.boolean(),
    creatorId: z.string().cuid().nullable().optional(),
    members: z.array(clientChatParticipantSchema).optional(),
    lastMessage: chatLastMessageSchema.nullable().optional(),
    avatarUrl: z.string().url().nullable().optional(),
    unreadCount: z.number().int().nonnegative().optional(),
    createdAt: z.date(),
    updatedAt: z.date(),
    // messages не включаем в общую схему DTO чата, чтобы не перегружать
    // их будем запрашивать отдельно для конкретного чата.
});

export const sendMessageDtoSchema = z.object({
    chatId: z.string().cuid('Невалидный ID чата'),
    content: z.string().min(1, 'Сообщение не может быть пустым'),
    contentType: z.nativeEnum(MessageContentType).optional(),
});

export const markAsReadDtoSchema = z.object({
    // ... existing code ...
});
