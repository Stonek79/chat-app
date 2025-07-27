import { z } from 'zod';
import { UserRole } from '@chat-app/db';
import { VALIDATION_MESSAGES, VALIDATION_RULES } from '../constants/validation';

// Базовые схемы для валидации пользователей
export const clientUserSchema = z.object({
    id: z.cuid(),
    username: z
        .string()
        .min(VALIDATION_RULES.USERNAME.minLength, VALIDATION_MESSAGES.USERNAME_TOO_SHORT)
        .max(VALIDATION_RULES.USERNAME.maxLength, VALIDATION_MESSAGES.USERNAME_TOO_LONG),
    email: z.email({ message: VALIDATION_MESSAGES.INVALID_EMAIL }),
    avatarUrl: z.string().nullable(),
    publicKey: z.string().nullable(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
    lastSeenAt: z.coerce.date().nullable(),
    isOnline: z.boolean(),
    isVerified: z.boolean(),
    role: z.enum(UserRole),
});

// Схема для профиля пользователя (урезанная версия)
export const userProfileSchema = z.object({
    id: z.cuid(),
    username: z
        .string()
        .min(VALIDATION_RULES.USERNAME.minLength, VALIDATION_MESSAGES.USERNAME_TOO_SHORT)
        .max(VALIDATION_RULES.USERNAME.maxLength, VALIDATION_MESSAGES.USERNAME_TOO_LONG),
    email: z.email(),
    avatarUrl: z.string().nullable(),
    createdAt: z.coerce.date(),
    lastSeenAt: z.coerce.date().nullable(),
    isOnline: z.boolean(),
    role: z.enum(UserRole),
});

// Схема для аутентифицированного пользователя
export const authenticatedUserSchema = clientUserSchema.pick({
    id: true,
    username: true,
    email: true,
    role: true,
    isVerified: true,
});

// API схемы
export const createUserSchema = z.object({
    username: z
        .string()
        .min(VALIDATION_RULES.USERNAME.minLength, VALIDATION_MESSAGES.USERNAME_TOO_SHORT)
        .max(VALIDATION_RULES.USERNAME.maxLength, VALIDATION_MESSAGES.USERNAME_TOO_LONG)
        .regex(VALIDATION_RULES.USERNAME.pattern, VALIDATION_MESSAGES.INVALID_USERNAME),
    email: z
        .email(VALIDATION_MESSAGES.INVALID_EMAIL)
        .max(VALIDATION_RULES.EMAIL.maxLength, VALIDATION_MESSAGES.EMAIL_TOO_LONG),
    password: z
        .string()
        .min(VALIDATION_RULES.PASSWORD.minLength, VALIDATION_MESSAGES.PASSWORD_TOO_SHORT)
        .max(VALIDATION_RULES.PASSWORD.maxLength, VALIDATION_MESSAGES.PASSWORD_TOO_LONG)
        .regex(VALIDATION_RULES.PASSWORD.pattern, VALIDATION_MESSAGES.INVALID_PASSWORD),
});

export const updateUserSchema = z
    .object({
        username: z
            .string()
            .min(VALIDATION_RULES.USERNAME.minLength, VALIDATION_MESSAGES.USERNAME_TOO_SHORT)
            .max(VALIDATION_RULES.USERNAME.maxLength, VALIDATION_MESSAGES.USERNAME_TOO_LONG)
            .regex(VALIDATION_RULES.USERNAME.pattern, VALIDATION_MESSAGES.INVALID_USERNAME)
            .optional(),
        email: z
            .email(VALIDATION_MESSAGES.INVALID_EMAIL)
            .max(VALIDATION_RULES.EMAIL.maxLength, VALIDATION_MESSAGES.EMAIL_TOO_LONG)
            .optional(),
        avatarUrl: z.url(VALIDATION_MESSAGES.INVALID_IMAGE_URL).nullable().optional(),
    })
    .refine(data => Object.keys(data).length > 0, {
        message: VALIDATION_MESSAGES.NO_UPDATE_FIELDS,
    });

export const loginSchema = z.object({
    email: z.email(VALIDATION_MESSAGES.INVALID_EMAIL),
    password: z
        .string()
        .min(VALIDATION_RULES.PASSWORD.minLength, VALIDATION_MESSAGES.PASSWORD_REQUIRED),
});

// Схемы для восстановления пароля
export const forgotPasswordSchema = z.object({
    email: z.email(VALIDATION_MESSAGES.INVALID_EMAIL),
});

export const resetPasswordSchema = z.object({
    token: z.string().min(1, VALIDATION_MESSAGES.TOKEN_REQUIRED),
    newPassword: z
        .string()
        .min(VALIDATION_RULES.PASSWORD.minLength, VALIDATION_MESSAGES.PASSWORD_TOO_SHORT)
        .max(VALIDATION_RULES.PASSWORD.maxLength, VALIDATION_MESSAGES.PASSWORD_TOO_LONG)
        .regex(VALIDATION_RULES.PASSWORD.pattern, VALIDATION_MESSAGES.INVALID_PASSWORD),
});

// Схемы для подтверждения email
export const verifyEmailSchema = z.object({
    token: z.string().min(1, VALIDATION_MESSAGES.TOKEN_VERIFICATION_REQUIRED),
});

export const resendVerificationSchema = z.object({
    email: z.email(VALIDATION_MESSAGES.INVALID_EMAIL),
});
