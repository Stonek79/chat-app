import type { z } from 'zod';
import type { UserRole } from '@prisma/client';
import type { JWTPayload as JoseJWTPayload } from 'jose';
import type {
    loginSchema,
    registerSchema,
    updateUserProfileSchema,
    userResponseSchema,
} from '@/schemas';

/**
 * @description Тип для публичных данных пользователя, которые безопасно отправлять на клиент.
 * Выводится из `userResponseSchema`.
 */
export type ClientUser = z.infer<typeof userResponseSchema>;

/**
 * @description Тип для данных формы входа.
 * Выводится из `loginSchema`.
 */
export type LoginCredentials = z.infer<typeof loginSchema>;

/**
 * @description Тип для данных формы регистрации.
 * Выводится из `registerSchema`.
 */
export type RegisterCredentials = z.infer<typeof registerSchema>;

/**
 * @description Тип для данных формы обновления профиля.
 * Выводится из `updateUserProfileSchema`.
 */
export type UpdateUserProfilePayload = z.infer<typeof updateUserProfileSchema>;

export interface AuthContextType {
    user: ClientUser | null;
    isLoading: boolean;
    authError: string | null;
    setAuthError: (error: string | null) => void;
    login: (credentials: LoginCredentials, returnTo?: string) => Promise<ClientUser | null>;
    logout: () => Promise<void>;
    register: (credentials: RegisterCredentials) => Promise<void>;
    checkAuthStatus: () => Promise<void>;
    updateUser?: (payload: UpdateUserProfilePayload) => Promise<ClientUser | null>;
    clearAuthError: () => void;
}

/**
 * @description Полезная нагрузка JWT, специфичная для нашего приложения.
 */
export interface AppJWTPayload extends JoseJWTPayload {
    userId: string;
    email: string;
    username: string;
    role: UserRole;
    userAvatar?: string;
}
