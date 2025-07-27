import { z } from 'zod';
import { clientUserSchema, authenticatedUserSchema } from './user';
import { UserRole } from '@chat-app/db';

// Схемы для состояния аутентификации
export const authStateSchema = z.object({
    user: clientUserSchema.nullable(),
    isAuthenticated: z.boolean(),
    isLoading: z.boolean(),
    error: z.string().nullable(),
});

export const sessionDataSchema = z.object({
    userId: z.cuid(),
    username: z.string(),
    email: z.email(),
    role: z.enum(UserRole),
    avatarUrl: z.string().nullable(),
    iat: z.number(),
    exp: z.number(),
});

// Схема для полного JWT payload
export const appJWTPayloadSchema = z.object({
    userId: z.cuid(),
    email: z.email(),
    username: z.string(),
    role: z.enum(UserRole),
    avatarUrl: z.string().nullable(),
    iat: z.number(),
});

export const tokenPayloadSchema = z.object({
    userId: z.cuid(),
    sessionId: z.string().optional(),
});

// Схемы для API responses
export const authResponseSchema = z.object({
    user: clientUserSchema,
    token: z.string(),
});

export const refreshTokenResponseSchema = z.object({
    token: z.string(),
    user: clientUserSchema,
});

// Схемы для JWT middleware
export const authenticatedRequestSchema = z.object({
    user: authenticatedUserSchema,
    sessionId: z.cuid().optional(),
});
