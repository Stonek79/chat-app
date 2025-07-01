import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

import { AUTH_TOKEN_COOKIE_NAME } from '@/constants';
import { ApiError, handleApiError, prisma } from '@/lib';
import { jwtPayloadSchema, userResponseSchema } from '@/schemas';
import { type ClientUser } from '@/types';

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Получение данных текущего аутентифицированного пользователя
 *     tags: [Auth]
 *     description: Проверяет JWT токен из cookie и возвращает данные пользователя, если токен валиден.
 *     security:
 *       - cookieAuth: [] # Указывает, что эндпоинт требует аутентификации через cookie
 *     responses:
 *       200:
 *         description: Данные пользователя успешно получены.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/ClientUser'
 *       401:
 *         description: Пользователь не аутентифицирован (токен отсутствует, невалиден или истек).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *         headers:
 *           Set-Cookie:
 *             description: Если токен невалиден или истек, инструктирует браузер удалить cookie (например, `token=; HttpOnly; Path=/; Max-Age=0`).
 *             schema:
 *               type: string
 *       500:
 *         description: Внутренняя ошибка сервера (например, JWT_SECRET не настроен).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export async function GET(req: NextRequest) {
    try {
        const token = req.cookies.get(AUTH_TOKEN_COOKIE_NAME)?.value;

        if (!token) {
            throw new ApiError('Токен аутентификации не предоставлен', 401);
        }

        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            console.error('JWT_SECRET не определен в .env');
            throw new ApiError('Ошибка конфигурации сервера (JWT)', 500);
        }

        let decoded: unknown;
        try {
            decoded = jwt.verify(token, jwtSecret);
        } catch (error) {
            const errResponse = NextResponse.json(
                { message: 'Невалидный или истекший токен', error: 'InvalidTokenError' },
                { status: 401 }
            );
            errResponse.cookies.set(AUTH_TOKEN_COOKIE_NAME, '', { maxAge: 0 });
            return errResponse;
        }

        const validationResult = jwtPayloadSchema.safeParse(decoded);

        if (!validationResult.success) {
            throw new ApiError('Некорректный формат токена', 401);
        }

        const { userId, username, email, role, avatarUrl, iat } = validationResult.data;

        // Для ускорения ответа и снижения нагрузки на БД,
        // мы доверяем данным из валидированного токена.
        // Запрос в БД остается при логине и обновлении профиля.
        const clientUser: ClientUser = {
            id: userId,
            username,
            email,
            role,
            avatarUrl: avatarUrl || null,
            createdAt: new Date(iat * 1000), // Приблизительное значение из токена
            updatedAt: new Date(iat * 1000), // Приблизительное значение из токена
        };

        const parsedUser = userResponseSchema.parse(clientUser);

        return NextResponse.json({ user: parsedUser }, { status: 200 });
    } catch (error) {
        if (error instanceof ApiError) {
            return handleApiError(error);
        }
        return handleApiError(error, { message: 'Ошибка при получении данных пользователя' });
    }
}
