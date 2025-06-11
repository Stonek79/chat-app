import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { AUTH_TOKEN_COOKIE_NAME } from '@/constants';
import { ApiError, handleApiError, prisma } from '@/lib';
import { loginSchema } from '@/schemas';

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Вход пользователя в систему
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john.doe@example.com
 *               password:
 *                 type: string
 *                 example: strongpassword123
 *     responses:
 *       200:
 *         description: Вход успешен. JWT токен установлен в HttpOnly cookie.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Вход успешен
 *                 user:
 *                   $ref: '#/components/schemas/ClientUser' # Ссылка на тип ClientUser
 *         headers:
 *           Set-Cookie:
 *             description: Устанавливает HttpOnly cookie с JWT токеном (например, `token=...; HttpOnly; Path=/; Max-Age=...`).
 *             schema:
 *               type: string
 *       400:
 *         description: Ошибка валидации данных.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Неверный пароль.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Учетная запись не поддерживает вход по паролю или email не подтвержден.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Пользователь с таким email не найден.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Внутренняя ошибка сервера.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const validation = loginSchema.safeParse(body);

        if (!validation.success) {
            throw new ApiError(
                'Ошибка валидации данных',
                400,
                validation.error.flatten().fieldErrors
            );
        }

        const { email, password } = validation.data;

        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            throw new ApiError('Пользователь с таким email не найден', 404); // Или 401 для безопасности, чтобы не раскрывать существование email
        }

        if (!user.hashedPassword) {
            // Это может произойти, если пользователь был создан, например, через соц. сети (OAuth) и не имеет пароля
            throw new ApiError('Учетная запись не поддерживает вход по паролю', 403);
        }

        const isPasswordValid = await bcrypt.compare(password, user.hashedPassword);
        if (!isPasswordValid) {
            throw new ApiError('Неверный пароль', 401);
        }

        if (!user.isVerified) {
            throw new ApiError('Пожалуйста, подтвердите ваш email перед входом', 403); // 403 Forbidden
        }

        // Генерация JWT
        const tokenPayload = {
            userId: user.id,
            email: user.email,
            username: user.username,
            role: user.role,
        };

        const jwtSecret: jwt.Secret = process.env.JWT_SECRET as string;
        if (!jwtSecret) {
            console.error('JWT_SECRET не определен в .env');
            throw new ApiError('Ошибка конфигурации сервера (JWT) - секрет не найден', 500);
        }

        // Используем только строковое значение для expiresIn, как рекомендовано для простоты
        const expiresInString: string = process.env.JWT_EXPIRES_IN || '14d';

        const signOptions: jwt.SignOptions = {
            expiresIn: expiresInString as jwt.SignOptions['expiresIn'],
        };

        const token = jwt.sign(tokenPayload, jwtSecret, signOptions);

        // Установка HttpOnly cookie
        const response = NextResponse.json(
            {
                message: 'Вход успешен',
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                },
            },
            { status: 200 }
        );

        response.cookies.set(AUTH_TOKEN_COOKIE_NAME, token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // В продакшене только HTTPS
            sameSite: 'lax', // Или 'strict'
            path: '/',
            maxAge: parseInt(process.env.JWT_MAX_AGE_SECONDS || String(14 * 24 * 60 * 60)), // 14 дней в секундах
        });

        return response;
    } catch (error) {
        if (error instanceof ApiError) {
            return handleApiError(error, {
                status: error.status,
                message: error.message,
                errors: error.errors,
            });
        }
        return handleApiError(error, { message: 'Внутренняя ошибка сервера при входе' });
    }
}
