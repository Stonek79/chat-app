import { MessageContentType } from '@prisma/client';
import { z } from 'zod';

/**
 * Схема для enum MessageContentType из Prisma.
 */
export const messageContentTypeSchema = z.nativeEnum(MessageContentType);

// Другие схемы, связанные с сообщениями
