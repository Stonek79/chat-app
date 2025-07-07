import { z } from 'zod';
import type {
    ClientUser,
    UpdateUserPayload,
    LoginCredentials,
    RegisterCredentials,
} from './user';
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
export interface AuthContextType {
    user: ClientUser | null;
    isLoading: boolean;
    authError: string | { [key: string]: string[] } | null;
    setAuthError: (error: string | null) => void;
    login: (credentials: LoginCredentials, returnTo?: string) => Promise<ClientUser | null>;
    logout: () => Promise<void>;
    register: (credentials: RegisterCredentials) => Promise<void>;
    checkAuthStatus: () => Promise<void>;
    updateUser: (payload: UpdateUserPayload) => Promise<ClientUser | null>;
    clearAuthError: () => void;
}
