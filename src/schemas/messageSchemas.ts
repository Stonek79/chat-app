import { z } from 'zod';
import { MessageContentType } from '@prisma/client';

/**
 * Схема для enum MessageContentType из Prisma.
 */
export const messageContentTypeSchema = z.nativeEnum(MessageContentType);

// Другие схемы, связанные с сообщениями
