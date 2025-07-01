import { z } from 'zod';
import { userRoleSchema } from './authSchemas';

/**
 * Схема для валидации данных при обновлении пользователя.
 * Разрешает обновлять только определенные поля.
 * Схема будет расширена при раработке функционала редактирования профиля.
 */
export const updateUserSchema = z.object({
    username: z
        .string()
        .min(3, 'Имя пользователя должно содержать минимум 3 символа')
        .max(30, 'Имя пользователя не должно превышать 30 символов')
        .optional(),
    // email: z.string().email('Некорректный email').optional(),
});


/**
 * Базовая схема пользователя для встраивания в другие схемы.
 */
export const basicUserSchema = z.object({
    id: z.string(),
    username: z.string(),
    email: z.string().email(),
    role: userRoleSchema,
    avatarUrl: z.string().url().nullable(),
});
