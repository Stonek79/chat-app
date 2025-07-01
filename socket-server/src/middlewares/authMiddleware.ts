import { parse as parseCookie } from 'cookie';
import { type JWTPayload, jwtVerify } from 'jose';

import { AUTH_SOCKET_TOKEN_COOKIE_NAME } from '#/constants';
import type { AppServerSocket, UserRole } from '#/types';

const JWT_SECRET = process.env.JWT_SECRET;

interface UserJWTPayload extends JWTPayload {
    /** Идентификатор пользователя. */
    userId: string;
    /** Email пользователя. */
    email: string;
    /** Имя пользователя (username). */
    username: string;
    /** Роль пользователя (например, 'USER' или 'ADMIN'). */
    role: UserRole; // Роль из токена USER | ADMIN
    /** Аватарка пользователя */
    userAvatar: string;
}

/**
 * Middleware для аутентификации Socket.IO подключений через JWT из HttpOnly cookie.
 */
export const jwtAuthMiddleware = async (socket: AppServerSocket, next: (err?: Error) => void) => {
    if (!JWT_SECRET) {
        console.error('[AuthMiddleware] JWT_SECRET не настроен на сервере Socket.IO.');
        return next(new Error('Ошибка конфигурации сервера: отсутствует секретный ключ JWT.'));
    }

    const request = socket.request;
    const cookieHeader = request.headers.cookie;

    if (!cookieHeader) {
        console.warn('[AuthMiddleware] Cookie не найдены в handshake запросе.');
        return next(new Error('Аутентификация не удалась: cookie отсутствуют.'));
    }

    const cookies = parseCookie(cookieHeader);
    const token = cookies[AUTH_SOCKET_TOKEN_COOKIE_NAME];

    if (!token) {
        console.warn(
            `[AuthMiddleware] JWT токен (${AUTH_SOCKET_TOKEN_COOKIE_NAME}) не найден в cookie.`
        );
        return next(new Error('Аутентификация не удалась: токен отсутствует.'));
    }

    try {
        const secretKey = new TextEncoder().encode(JWT_SECRET);
        const {
            payload,
        }: {
            payload: UserJWTPayload;
        } = await jwtVerify(token, secretKey);

        if (!payload.userId) {
            console.error(
                '[AuthMiddleware] ID пользователя (id/sub/userId) не найден в JWT payload.',
                payload
            );
            return next(
                new Error('Ошибка аутентификации: невалидный формат токена (нет id/sub/userId).')
            );
        }

        socket.data.user = {
            userId: payload.userId,
            email: payload.email,
            username: payload.username,
            role: payload.role,
            avatarUrl: payload.userAvatar || '',
        };

        console.log(
            `[AuthMiddleware] Пользователь ${socket.data.user!.username} (Role: ${socket.data.user!.role || 'N/A'}) успешно аутентифицирован для Socket.IO.`
        );
        next();
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Ошибка аутентификации';
        console.error(`[Auth Middleware] Ошибка JWT верификации: ${message}`);
        next(new Error(message));
    }
};
