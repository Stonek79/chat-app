import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { handleApiError, ApiError, prisma } from '@/lib';
import { UserRole, type ClientUser } from '@/types';
import { AUTH_TOKEN_COOKIE_NAME } from '@/constants';

interface DecodedToken {
    userId: string;
    email: string;
    username: string;
    role: string;
    // iat: number; // Issued at
    // exp: number; // Expires at
}

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
        const tokenCookie = req.cookies.get(AUTH_TOKEN_COOKIE_NAME);

        if (!tokenCookie) {
            throw new ApiError('Пользователь не аутентифицирован', 401);
        }

        const token = tokenCookie.value;
        const jwtSecret = process.env.JWT_SECRET;

        if (!jwtSecret) {
            console.error('JWT_SECRET не определен в .env для /api/auth/me');
            throw new ApiError('Ошибка конфигурации сервера (JWT)', 500);
        }

        let decoded;
        try {
            decoded = jwt.verify(token, jwtSecret) as DecodedToken;
        } catch (jwtError) {
            // Ошибка верификации токена (невалидный, истекший и т.д.)
            console.warn('Ошибка верификации JWT для /api/auth/me:', jwtError);
            // Удаляем невалидный cookie
            const errResponse = NextResponse.json(
                { message: 'Невалидный или истекший токен' },
                { status: 401 }
            );
            errResponse.cookies.set(AUTH_TOKEN_COOKIE_NAME, '', {
                httpOnly: true,
                path: '/',
                maxAge: 0,
            });
            return errResponse;
        }

        // Проверка и приведение типа для роли
        const userRole = decoded.role as UserRole;
        if (!Object.values(UserRole).includes(userRole)) {
            console.error(`Невалидное значение роли из JWT: ${decoded.role}`);
            // Можно решить удалить токен или вернуть ошибку, указывающую на проблему с токеном
            throw new ApiError('Невалидные данные в токене (роль)', 401);
        }

        // Можно дополнительно проверить, существует ли пользователь в БД, хотя JWT должен быть достаточным
        // const userFromDb = await prisma.user.findUnique({ where: { id: decoded.userId } });
        // if (!userFromDb) {
        //   throw new ApiError('Пользователь из токена не найден в БД', 401);
        // }

        const clientUser: ClientUser = {
            id: decoded.userId,
            username: decoded.username,
            email: decoded.email,
            role: userRole,
            avatarUrl: '',
        };

        return NextResponse.json({ user: clientUser }, { status: 200 });
    } catch (error) {
        if (error instanceof ApiError) {
            return handleApiError(error, {
                status: error.status,
                message: error.message,
                errors: error.errors,
            });
        }
        // Важно не прокидывать сообщение об ошибке, если это не ApiError, чтобы не раскрыть детали
        return handleApiError(error, { message: 'Ошибка получения данных пользователя' });
    }
}
