import { z } from 'zod';
import { ChatParticipantRole } from '@chat-app/db';
import { VALIDATION_MESSAGES, VALIDATION_RULES } from '../constants/validation';
import { displayMessageSchema } from './message';

// Базовые схемы для чатов
export const chatSchema = z.object({
    id: z.cuid(),
    name: z.string().nullable(),
    isGroupChat: z.boolean(),
    avatarUrl: z.string().nullable(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
});

// Схема участника чата (без encryptedSessionKey для клиента)
export const chatParticipantInfoSchema = z.object({
    id: z.cuid(),
    chatId: z.cuid(),
    userId: z.cuid(),
    joinedAt: z.coerce.date(),
    leftAt: z.coerce.date().nullable(),
    role: z.enum(ChatParticipantRole),
    lastReadMessageId: z.cuid().nullable(),
    user: z.object({
        id: z.cuid(),
        username: z.string(),
        email: z.email(),
        avatarUrl: z.string().nullable(),
        role: z.string(),
    }),
});

// API схемы
export const createChatSchema = z
    .object({
        name: z
            .string()
            .min(VALIDATION_RULES.USERNAME.minLength, VALIDATION_MESSAGES.CHAT_NAME_EMPTY)
            .max(VALIDATION_RULES.CHAT_NAME.maxLength, VALIDATION_MESSAGES.CHAT_NAME_TOO_LONG)
            .optional(),
        isGroupChat: z.boolean(),
        participantIds: z
            .array(z.cuid())
            .min(1, VALIDATION_MESSAGES.NO_PARTICIPANTS)
            .max(100, VALIDATION_MESSAGES.TOO_MANY_PARTICIPANTS),
    })
    .refine(
        data => {
            // Для групповых чатов название обязательно
            if (data.isGroupChat && !data.name) {
                return false;
            }
            // Для приватных чатов должно быть ровно 2 участника
            if (!data.isGroupChat && data.participantIds.length !== 1) {
                return false;
            }
            return true;
        },
        {
            message: VALIDATION_MESSAGES.INVALID_CHAT_PARAMS,
        }
    );

export const updateChatSchema = z
    .object({
        name: z
            .string()
            .min(VALIDATION_RULES.USERNAME.minLength, VALIDATION_MESSAGES.CHAT_NAME_EMPTY)
            .max(VALIDATION_RULES.CHAT_NAME.maxLength, VALIDATION_MESSAGES.CHAT_NAME_TOO_LONG)
            .optional(),
        avatarUrl: z.url(VALIDATION_MESSAGES.INVALID_IMAGE_URL).nullable().optional(),
    })
    .refine(data => Object.keys(data).length > 0, {
        message: VALIDATION_MESSAGES.NO_UPDATE_FIELDS,
    });

export const addParticipantSchema = z.object({
    chatId: z.cuid(),
    userId: z.cuid(),
    role: z.enum(ChatParticipantRole).default(ChatParticipantRole.MEMBER),
});

export const removeParticipantSchema = z.object({
    chatId: z.cuid(),
    userId: z.cuid(),
});

export const updateParticipantRoleSchema = z.object({
    chatId: z.cuid(),
    userId: z.cuid(),
    role: z.enum(ChatParticipantRole),
});

// Схемы для поиска
export const chatSearchParamsSchema = z.object({
    query: z.string().optional(),
    isGroupChat: z.boolean().optional(),
    limit: z.number().int().min(1).max(100).default(20),
    offset: z.number().int().min(0).default(0),
});

// UI схемы для клиентских типов
export const clientChatSchema = chatSchema.extend({
    members: z.array(chatParticipantInfoSchema),
    messages: z.array(displayMessageSchema).default([]),
    unreadCount: z.number().int().min(0).default(0),
    lastMessage: z
        .object({
            id: z.cuid(),
            content: z.string(),
            createdAt: z.coerce.date(),
            sender: z.object({
                id: z.cuid(),
                username: z.string(),
                avatarUrl: z.string().nullable(),
            }),
            contentType: z.string(),
        })
        .nullable()
        .optional(),
});

export const chatWithDetailsSchema = clientChatSchema.extend({
    participantCount: z.number().int().min(0),
    isActive: z.boolean(),
    canEdit: z.boolean(),
    canDelete: z.boolean(),
    canAddMembers: z.boolean(),
    canRemoveMembers: z.boolean(),
});

export const chatListResponseSchema = z.object({
    chats: z.array(chatWithDetailsSchema),
});

export const chatResponseSchema = z.object({
    chat: chatWithDetailsSchema,
});

export const chatListItemSchema = z.object({
    id: z.cuid(),
    name: z.string().nullable(),
    isGroupChat: z.boolean(),
    avatarUrl: z.string().nullable(),
    updatedAt: z.coerce.date(),
    unreadCount: z.number().int().min(0),
    participantCount: z.number().int().min(0),
    lastMessage: z
        .object({
            id: z.cuid(),
            content: z.string(),
            createdAt: z.coerce.date(),
            sender: z.object({
                id: z.cuid(),
                username: z.string(),
                avatarUrl: z.string().nullable(),
            }),
        })
        .nullable()
        .optional(),
});

export const chatMessagesResponseSchema = z.object({
    messages: z.array(displayMessageSchema),
    nextCursor: z.string().nullable(),
});
