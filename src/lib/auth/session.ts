import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { AUTH_TOKEN_COOKIE_NAME } from '@/constants';
import { UserRole } from '@/types'; // Для типа роли
import { cookies } from 'next/headers';
import { jwtVerify, type JWTPayload as JoseJWTPayload } from 'jose'; // Переименовываем, чтобы избежать конфликта с JWTPayload из middleware, если бы он был здесь
import { ClientUser } from '@/types'; // Убедимся, что ClientUser импортирован или определен

export interface AuthenticatedUser {
    userId: string;
    email: string;
    username: string;
    role: UserRole;
}

interface DecodedTokenInternal {
    userId: string;
    email: string;
    username: string;
    role: string; // Роль из токена приходит как строка
    iat: number;
    exp: number;
}

/**
 * Расширенный интерфейс для JWTPayload из jose, включающий специфичные для приложения поля.
 * Аналогично UserJWTPayload из middleware.ts
 */
interface AppJWTPayload extends JoseJWTPayload {
    userId: string;
    email: string;
    username: string;
    role: string; // Роль из токена приходит как строка
}

/**
 * Извлекает и верифицирует JWT из cookie запроса,
 * возвращая данные аутентифицированного пользователя или null.
 * Не выбрасывает ошибку, чтобы можно было использовать в middleware или необязательно защищенных роутах.
 * @param req NextRequest
 * @returns Promise<AuthenticatedUser | null>
 */
export async function getCurrentUser(req: NextRequest): Promise<AuthenticatedUser | null> {
    const tokenCookie = req.cookies.get(AUTH_TOKEN_COOKIE_NAME);

    if (!tokenCookie) {
        return null;
    }

    const token = tokenCookie.value;
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
        console.error('JWT_SECRET не определен в .env для getCurrentUser');
        // В этом случае лучше выбрасывать ошибку конфигурации сервера,
        // но для простоты использования в разных контекстах вернем null.
        // Если вы хотите строгого поведения, можно раскомментировать:
        // throw new Error('Server configuration error: JWT_SECRET is not set');
        return null;
    }

    try {
        const decoded = jwt.verify(token, jwtSecret) as DecodedTokenInternal;

        // Валидация роли
        const userRole = decoded.role as UserRole;
        if (!Object.values(UserRole).includes(userRole)) {
            console.warn(`Невалидное значение роли из JWT в getCurrentUser: ${decoded.role}`);
            return null; // Невалидный токен
        }

        return {
            userId: decoded.userId,
            email: decoded.email,
            username: decoded.username,
            role: userRole,
        };
    } catch (jwtError) {
        // Ошибка верификации токена (невалидный, истекший и т.д.)
        // console.warn('Ошибка верификации JWT в getCurrentUser:', jwtError);
        return null;
    }
}

/**
 * Извлекает и верифицирует JWT из cookie в Server Component,
 * возвращая данные аутентифицированного пользователя (ClientUser) или null.
 * Использует 'jose' для верификации, совместимой с Edge Runtime.
 * @returns Promise<ClientUser | null>
 */
export async function getCurrentUserFromSessionCookie(): Promise<ClientUser | null> {
    const cookieStore = await cookies(); // Дожидаемся разрешения промиса
    const tokenCookie = cookieStore.get(AUTH_TOKEN_COOKIE_NAME);

    if (!tokenCookie) {
        return null;
    }

    const token = tokenCookie.value;
    const JWT_SECRET_KEY = process.env.JWT_SECRET;

    if (!JWT_SECRET_KEY) {
        console.error('JWT_SECRET не определен в .env для getCurrentUserFromSessionCookie');
        // В Server Component такая ошибка должна приводить к падению или ошибке рендера,
        // но для безопасности вернем null, чтобы приложение не упало полностью.
        // В идеале, это состояние должно быть поймано на этапе сборки/развертывания.
        return null;
    }

    try {
        const secret = new TextEncoder().encode(JWT_SECRET_KEY);
        const { payload } = await jwtVerify(token, secret);
        const decodedPayload = payload as AppJWTPayload;

        // Валидация роли (пример, если UserRole enum)
        const userRole = decodedPayload.role as UserRole;
        if (!Object.values(UserRole).includes(userRole)) {
            console.warn(
                `Невалидное значение роли из JWT в getCurrentUserFromSessionCookie: ${decodedPayload.role}`
            );
            return null; // Невалидный токен
        }

        return {
            id: decodedPayload.userId, // ClientUser ожидает id
            email: decodedPayload.email,
            username: decodedPayload.username,
            role: userRole,
            avatarUrl: '',
        };
    } catch (error: unknown) {
        console.warn(
            'JWT verification failed in getCurrentUserFromSessionCookie:',
            error instanceof Error ? error.message : 'Unknown error'
        );
        return null;
    }
}

// Также можно добавить функцию для проверки сессии, которая выбрасывает ApiError, если пользователь не найден
// import { ApiError } from './api'; // Предполагается, что ApiError экспортируется из @/lib/api

/**
 * Гарантирует, что пользователь аутентифицирован, иначе выбрасывает ApiError.
 * @param req NextRequest
 * @returns Promise<AuthenticatedUser>
 * @throws ApiError если пользователь не аутентифицирован или токен невалиден.
 */
// export async function ensureAuthenticated(req: NextRequest): Promise<AuthenticatedUser> {
//   const user = await getCurrentUser(req);
//   if (!user) {
//     throw new ApiError('Пользователь не аутентифицирован', 401);
//   }
//   return user;
// }
