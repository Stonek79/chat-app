import { z } from 'zod';
import { clientChatSchema } from './chatSchemas';

/**
 * Схема для уведомления о создании нового чата.
 * Валидирует, что мы получили полный объект чата и ID инициатора.
 */
export const newChatNotificationSchema = z.object({
    type: z.literal('NEW_CHAT'),
    data: z.object({
        chatData: clientChatSchema,
        initiatorUserId: z.string().cuid(),
    }),
});

/**
 * Схема для уведомления об удалении сообщения.
 */
export const messageDeletedNotificationSchema = z.object({
    type: z.literal('MESSAGE_DELETED'),
    data: z.object({
        chatId: z.string().cuid(),
        messageId: z.string().cuid(),
        action: z.enum(['soft_delete', 'force_delete']),
    }),
});

/**
 * Общая схема-дискриминатор, которая может парсить разные типы уведомлений.
 */
export const redisNotificationSchema = z.discriminatedUnion('type', [
    newChatNotificationSchema,
    messageDeletedNotificationSchema,
]);

export type RedisNotificationPayload = z.infer<typeof redisNotificationSchema>;
