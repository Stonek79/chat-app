import {
    REDIS_EVENT_MESSAGE_DELETED,
    REDIS_EVENT_NEW_CHAT,
    REDIS_EVENT_MESSAGE_EDITED,
    REDIS_EVENT_CHAT_DELETED,
    chatWithDetailsSchema,
} from '@chat-app/core';
import { messageEditedPayloadSchema, messageDeletedPayloadSchema } from './payloads';
import { z } from 'zod';

export const newChatNotificationSchema = z.object({
    type: z.literal(REDIS_EVENT_NEW_CHAT),
    data: chatWithDetailsSchema,
});

export const messageEditedNotificationSchema = z.object({
    type: z.literal(REDIS_EVENT_MESSAGE_EDITED),
    data: messageEditedPayloadSchema,
});

export const messageDeletedNotificationSchema = z.object({
    type: z.literal(REDIS_EVENT_MESSAGE_DELETED),
    data: messageDeletedPayloadSchema,
});

export const chatDeletedNotificationSchema = z.object({
    type: z.literal(REDIS_EVENT_CHAT_DELETED),
    data: z.object({
        chatId: z.string(),
        memberIds: z.array(z.string()),
        userId: z.string(),
    }),
});

export const redisNotificationSchema = z.discriminatedUnion('type', [
    newChatNotificationSchema,
    messageEditedNotificationSchema,
    messageDeletedNotificationSchema,
    chatDeletedNotificationSchema,
]);
