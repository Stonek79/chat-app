import { User, UserRole } from '@prisma/client';
import { z } from 'zod';

import { updateUserSchema } from '@/schemas';

export type { User, UserRole } from '@prisma/client';

export type BasicUser = Pick<User, 'id' | 'email' | 'username' | 'avatarUrl' | 'role'>;

/**
 * @interface AuthenticatedUser
 * @description Представляет собой аутентифицированного пользователя, как это определено в JWT.
 */
export interface AuthenticatedUser {
    id: string;
    username: string;
    email: string;
    role: UserRole;
}

/**
 * @type UpdateUserPayload
 * @description Тип данных для формы обновления пользователя. Выводится из Zod-схемы.
 */
export type UpdateUserPayload = z.infer<typeof updateUserSchema>;
