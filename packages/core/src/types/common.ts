import { z } from 'zod';
import { loadingStateSchema, notificationSchema } from '../schemas/common';

// ОСНОВНЫЕ ТИПЫ (выведены из Zod схем - единый источник истины)
export type LoadingState = z.infer<typeof loadingStateSchema>;
export type Notification = z.infer<typeof notificationSchema>;

// API ОТВЕТЫ (определены вручную, так как схемы являются функциями)
export type ApiResponse<T = unknown> =
    | { success: true; data: T }
    | { success: false; error: string };

export type PaginatedResponse<T> = {
    data: T[];
    pagination: {
        total: number;
        limit: number;
        offset: number;
        hasMore: boolean;
    };
};

export type CursorPaginatedResponse<T> = {
    data: T[];
    pagination: {
        hasMore: boolean;
        nextCursor?: string;
        prevCursor?: string;
    };
};

// УТИЛИТАРНЫЕ ТИПЫ
export type ID = string;
export type Timestamp = Date;
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredOnly<T, K extends keyof T> = Pick<T, K> & Partial<Omit<T, K>>;

// ОБЩИЕ ТИПЫ ДЛЯ СОСТОЯНИЙ
export type AsyncState<T> = {
    data: T | null;
    status: LoadingState;
    error: string | null;
};
