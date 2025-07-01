import { UserRole } from '@prisma/client';
import { z } from 'zod';

import { UserRoleEnum, validationMessages } from '@/constants';

// Константы для валидации
const USERNAME_MIN_LENGTH = 3;
const USERNAME_MAX_LENGTH = 30;
const PASSWORD_MIN_LENGTH = 6;
const USERNAME_PATTERN = /^[a-zA-Z0-9_]+$/;

/**
 * @description Схема для валидации данных при регистрации нового пользователя.
 * Используется в `POST /api/auth/register`.
 */
export const registerSchema = z.object({
    username: z
        .string()
        .min(
            USERNAME_MIN_LENGTH,
            validationMessages.usernameLength(USERNAME_MIN_LENGTH, USERNAME_MAX_LENGTH)
        )
        .max(
            USERNAME_MAX_LENGTH,
            validationMessages.usernameLength(USERNAME_MIN_LENGTH, USERNAME_MAX_LENGTH)
        )
        .regex(USERNAME_PATTERN, validationMessages.usernamePattern),
    email: z.string().email(validationMessages.invalidEmail),
    password: z
        .string()
        .min(PASSWORD_MIN_LENGTH, validationMessages.passwordLength(PASSWORD_MIN_LENGTH)),
});

/**
 * @description Схема для валидации данных при входе пользователя.
 * Используется в `POST /api/auth/login`.
 */
export const loginSchema = z.object({
    email: z.string().email(validationMessages.invalidEmail),
    password: z.string().min(1, validationMessages.required),
});

/**
 * @description Схема для валидации данных при обновлении профиля пользователя.
 * Поля являются опциональными.
 */
export const updateUserProfileSchema = z.object({
    username: z
        .string()
        .min(
            USERNAME_MIN_LENGTH,
            validationMessages.usernameLength(USERNAME_MIN_LENGTH, USERNAME_MAX_LENGTH)
        )
        .max(
            USERNAME_MAX_LENGTH,
            validationMessages.usernameLength(USERNAME_MIN_LENGTH, USERNAME_MAX_LENGTH)
        )
        .regex(USERNAME_PATTERN, validationMessages.usernamePattern)
        .optional(),
    email: z.string().email(validationMessages.invalidEmail).optional(),
});

/**
 * @description Схема для публичных данных пользователя, которые безопасно отправлять на клиент.
 * Используется в ответе `GET /api/auth/me` и при логине.
 */
export const userResponseSchema = z.object({
    id: z.string().cuid(),
    username: z.string(),
    email: z.string().email(),
    role: z.nativeEnum(UserRoleEnum),
    avatarUrl: z.string().url().nullable().optional(),
    createdAt: z.date(),
    updatedAt: z.date(),
});

/**
 * Схема для enum UserRole из Prisma.
 * Позволяет использовать роли в других Zod-схемах.
 */
export const userRoleSchema = z.nativeEnum(UserRole);

/**
 * @description Схема для валидации полезной нагрузки JWT токена.
 * Гарантирует, что декодированный токен содержит все необходимые поля.
 */
export const jwtPayloadSchema = z.object({
    userId: z.string().cuid(),
    email: z.string().email(),
    username: z.string(),
    role: userRoleSchema,
    avatarUrl: z.string().url().nullable().optional(),
    iat: z.number(),
    exp: z.number(),
});
