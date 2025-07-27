import { z } from 'zod';

// Базовые схемы для валидации
export const idSchema = z.cuid();
export const timestampSchema = z.date();
export const sortOrderSchema = z.enum(['asc', 'desc']);

// Схемы для API ответов
export const apiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
    z.discriminatedUnion('success', [
        z.object({
            success: z.literal(true),
            data: dataSchema,
        }),
        z.object({
            success: z.literal(false),
            error: z.string(),
        }),
    ]);

export const validationErrorSchema = z.object({
    field: z.string(),
    message: z.string(),
});

export const apiErrorSchema = z.object({
    message: z.string(),
    code: z.string().optional(),
    details: z.array(validationErrorSchema).optional(),
    statusCode: z.number().optional(),
});

// Схемы для пагинации
export const paginationSchema = z.object({
    total: z.number().int().min(0),
    limit: z.number().int().min(1),
    offset: z.number().int().min(0),
    hasMore: z.boolean(),
});

export const paginatedResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
    z.object({
        data: z.array(dataSchema),
        pagination: paginationSchema,
    });

export const cursorPaginationSchema = z.object({
    hasMore: z.boolean(),
    nextCursor: z.string().optional(),
    prevCursor: z.string().optional(),
});

export const cursorPaginatedResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
    z.object({
        data: z.array(dataSchema),
        pagination: cursorPaginationSchema,
    });

// Схемы для поиска и фильтрации
export const baseSearchParamsSchema = z.object({
    limit: z.number().int().min(1).max(100).default(20),
    offset: z.number().int().min(0).default(0),
    sortBy: z.string().optional(),
    sortOrder: sortOrderSchema.default('desc'),
});

// Схемы для состояний загрузки
export const loadingStateSchema = z.enum(['idle', 'loading', 'success', 'error']);

export const asyncStateSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
    z.object({
        data: dataSchema.nullable(),
        status: loadingStateSchema,
        error: z.string().nullable(),
    });

// Схемы для WebSocket событий
export const webSocketEventSchema = <T extends z.ZodTypeAny>(payloadSchema: T) =>
    z.object({
        type: z.string(),
        payload: payloadSchema,
        timestamp: z.date(),
    });

// Схемы для уведомлений
export const notificationTypeSchema = z.enum(['info', 'success', 'warning', 'error']);

export const notificationSchema = z.object({
    id: z.cuid(),
    type: notificationTypeSchema,
    title: z.string(),
    message: z.string().optional(),
    duration: z.number().optional(),
    persistent: z.boolean().optional(),
    createdAt: z.coerce.date(),
});
