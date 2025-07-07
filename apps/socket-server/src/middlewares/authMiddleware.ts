import { parse as parseCookie } from 'cookie';
import { AUTH_TOKEN_COOKIE_NAME } from '@chat-app/core';
import type { AppSocket } from '@chat-app/socket-shared';
import type { AppJWTPayload } from '@chat-app/core';

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Middleware для аутентификации Socket.IO подключений через JWT из HttpOnly cookie.
 */
export const jwtAuthMiddleware = async (socket: AppSocket, next: (err?: Error) => void) => {
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
    const token = cookies[AUTH_TOKEN_COOKIE_NAME];

    if (!token) {
        console.warn(
            `[AuthMiddleware] JWT токен (${AUTH_TOKEN_COOKIE_NAME}) не найден в cookie.`
        );
        return next(new Error('Аутентификация не удалась: токен отсутствует.'));
    }

    try {
        const { jwtVerify } = await import('jose');
        const secretKey = new TextEncoder().encode(JWT_SECRET);
        const { payload } = await jwtVerify(token, secretKey);

        const userPayload = payload as unknown as AppJWTPayload;

        // Убеждаемся, что данные валидны и пользователь активен
        if (!userPayload || typeof userPayload.userId !== 'string') {
            console.warn('[AuthMiddleware] JWT токен содержит невалидную структуру пользователя.');
            return next(new Error('Аутентификация не удалась: невалидный токен.'));
        }

        // Добавляем данные пользователя к сокету
        socket.data.user = {
            ...userPayload,
            avatarUrl: userPayload.avatarUrl ?? null, // Конвертируем undefined в null
        };

        console.log(`✅ [AuthMiddleware] User ${userPayload.username} authenticated.`);
        next();
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.warn(`[AuthMiddleware] JWT verification failed: ${errorMessage}`);
        return next(new Error('Аутентификация не удалась: невалидный токен.'));
    }
};
