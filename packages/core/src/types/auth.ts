import { z } from 'zod';
import type { KeyedMutator } from 'swr';
import type { ClientUser, UpdateUserPayload, LoginCredentials, RegisterCredentials } from './user';
import {
    authStateSchema,
    sessionDataSchema,
    appJWTPayloadSchema,
    tokenPayloadSchema,
    authenticatedRequestSchema,
    authResponseSchema,
    refreshTokenResponseSchema,
} from '../schemas/auth';

// ОСНОВНЫЕ ТИПЫ (выведены из Zod схем - единый источник истины)
export type AuthState = z.infer<typeof authStateSchema>;
export type SessionData = z.infer<typeof sessionDataSchema>;
export type AppJWTPayload = z.infer<typeof appJWTPayloadSchema>;
export type TokenPayload = z.infer<typeof tokenPayloadSchema>;
export type AuthenticatedRequest = z.infer<typeof authenticatedRequestSchema>;

// API RESPONSE ТИПЫ (выведены из схем)
export type AuthResponse = z.infer<typeof authResponseSchema>;
export type RefreshTokenResponse = z.infer<typeof refreshTokenResponseSchema>;

// КОНТЕКСТ АУТЕНТИФИКАЦИИ (для React Context)
/**
 * Определяет контракт для AuthContext.
 * Предоставляет информацию о текущем пользователе и методы для управления аутентификацией.
 */
export interface AuthContextType {
    /** Текущий аутентифицированный пользователь или null, если не аутентифицирован. */
    user: ClientUser | null;
    /** True, если идет первоначальная загрузка данных пользователя. */
    isLoading: boolean;
    /** True, если пользователь аутентифицирован (user не равен null). */
    isAuthenticated: boolean;
    /** Объект ошибки от SWR, если запрос данных пользователя не удался. */
    error: Error | null;
    /**
     * Функция для входа в систему.
     * @param credentials - Данные для входа (email, пароль).
     * @param returnTo - Опциональный URL для перенаправления после успешного входа.
     * @returns Промис, который разрешается с данными пользователя.
     */
    login: (credentials: LoginCredentials, returnTo?: string) => Promise<ClientUser>;
    /** Функция для выхода из системы. */
    logout: () => Promise<void>;
    /**
     * Функция для регистрации нового пользователя.
     * @param credentials - Данные для регистрации.
     */
    register: (credentials: RegisterCredentials) => Promise<void>;
    /**
     * Функция для обновления данных пользователя.
     * @param payload - Данные для обновления.
     * @returns Промис, который разрешается с обновленными данными пользователя.
     */
    updateUser: (payload: UpdateUserPayload) => Promise<ClientUser>;
    /**
     * Глобальная функция mutate из SWR для управления кэшем аутентификации.
     * Позволяет выполнять оптимистичные обновления и ревалидацию.
     * @see https://swr.vercel.app/docs/mutation
     */
    mutate: KeyedMutator<AuthResponse | null>;
}
