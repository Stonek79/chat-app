import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { AUTH_TOKEN_COOKIE_NAME, appJWTPayloadSchema, toClientUser } from '@chat-app/core';
import { ApiError, handleApiError, prisma } from '@/lib';

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Получение данных текущего аутентифицированного пользователя
 *     tags: [Auth]
 *     description: Проверяет JWT токен из cookie, находит пользователя в базе данных и возвращает его актуальные данные.
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
 *         description: Пользователь не аутентифицирован (токен отсутствует, невалиден или истек) или не найден в базе данных.
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

            // Удаляем невалидный cookie
            errResponse.cookies.set(AUTH_TOKEN_COOKIE_NAME, '', { maxAge: 0 });
            return errResponse;
        }

        const validationResult = appJWTPayloadSchema.safeParse(decoded);

        if (!validationResult.success) {
            // Если токен есть, но его содержимое не соответствует схеме, это тоже ошибка авторизации
            throw new ApiError('Некорректный формат токена', 401);
        }

        const { userId } = validationResult.data;

        // Получаем самые свежие данные пользователя из БД
        const user = await prisma.user.findUnique({
            where: {
                id: userId,
            },
        });

        if (!user) {
            // Если пользователь с таким ID из токена не найден в БД, это критическая ошибка синхронизации
            // и токен следует считать невалидным.
            const errResponse = NextResponse.json(
                { message: 'Пользователь не найден', error: 'UserNotFound' },
                { status: 401 }
            );
            errResponse.cookies.set(AUTH_TOKEN_COOKIE_NAME, '', { maxAge: 0 });
            return errResponse;
        }

        // Преобразуем данные из Prisma в клиентский формат
        const clientUser = toClientUser(user);

        return NextResponse.json({ user: clientUser }, { status: 200 });
    } catch (error) {
        // Обработка ошибок ApiError для корректных HTTP-ответов
        if (error instanceof ApiError) {
            const response = NextResponse.json(
                { message: error.message, error: error.name }, // Используем error.name для кода ошибки
                { status: error.status }
            );
            // Если ошибка связана с аутентификацией, удаляем cookie
            if (error.status === 401) {
                response.cookies.set(AUTH_TOKEN_COOKIE_NAME, '', { maxAge: 0 });
            }
            return response;
        }
        // Обработка остальных (непредвиденных) ошибок
        return handleApiError(error, { message: 'Ошибка при получении данных пользователя' });
    }
}
