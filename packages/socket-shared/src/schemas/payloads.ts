import { z } from 'zod';

export const messageDeletedPayloadSchema = z.object({
    messageId: z.string().cuid(),
    chatId: z.string().cuid(),
    deletedAt: z.coerce.date(), // Используем coerce.date() для преобразования строки/числа в Date
});
