import { z } from 'zod';
import { displayMessageSchema } from '@chat-app/core';

export const messageDeletedPayloadSchema = z.object({
    messageId: z.cuid(),
    chatId: z.cuid(),
});

export const messageEditedPayloadSchema = displayMessageSchema;
