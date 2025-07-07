import { z } from 'zod';
import type { User } from '@chat-app/db';
import {
    clientUserSchema,
    userProfileSchema,
    authenticatedUserSchema,
    createUserSchema,
    updateUserSchema,
    loginSchema,
} from '../schemas/user';

// ОСНОВНЫЕ ТИПЫ (выведены из Zod схем - единый источник истины)
export type ClientUser = z.infer<typeof clientUserSchema>;
export type UserProfile = z.infer<typeof userProfileSchema>;
export type AuthenticatedUser = z.infer<typeof authenticatedUserSchema>;

// API ТИПЫ (выведены из схем)
export type CreateUserPayload = z.infer<typeof createUserSchema>;
export type UpdateUserPayload = z.infer<typeof updateUserSchema>;
export type LoginCredentials = z.infer<typeof loginSchema>;

// Алиасы для удобства
export type RegisterCredentials = CreateUserPayload;

// ТИПЫ ДЛЯ БД
export type PrismaUser = User;
