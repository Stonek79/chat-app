import { z } from 'zod';
import { VALIDATION_MESSAGES } from '../constants';

export const presignedUrlRequestSchema = z.object({
    fileName: z.string().min(1, VALIDATION_MESSAGES.FILENAME_REQUIRED),
    fileType: z.string().regex(/^[\w-]+\/[\w-.+]+$/, VALIDATION_MESSAGES.INVALID_MIME_TYPE),
    chatId: z.cuid(VALIDATION_MESSAGES.INVALID_CHAT_ID),
});

export const presignedUrlResponseSchema = z.object({
    uploadUrl: z.url(),
    publicUrl: z.url(),
});
