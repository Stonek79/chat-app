import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { hash } from 'bcryptjs';
import { createUserSchema } from '@chat-app/core';
import { ApiError, handleApiError, prisma } from '@/lib';

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Регистрация нового пользователя
 *     tags: [Auth]
 *     description: Создает нового пользователя в системе с проверкой уникальности email и username.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 30
 *                 pattern: '^[a-zA-Z0-9_-]+$'
 *                 description: Уникальное имя пользователя (только буквы, цифры, дефисы и подчеркивания)
 *                 example: "john_doe123"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Уникальный email адрес
 *                 example: "john@example.com"
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 description: Пароль пользователя
 *                 example: "securePassword123"
 *     responses:
 *       201:
 *         description: Пользователь успешно зарегистрирован. Требуется подтверждение email.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Пользователь успешно зарегистрирован. Проверьте email для подтверждения."
 *                 user:
 *                   $ref: '#/components/schemas/ClientUser'
 *       400:
 *         description: Ошибка валидации данных или пользователь уже существует.
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
        const validation = createUserSchema.safeParse(body);

        if (!validation.success) {
            throw new ApiError(
                'Ошибка валидации данных',
                400,
                validation.error.flatten().fieldErrors
            );
        }

        const { username, email, password } = validation.data;

        // Проверка уникальности email и username
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [{ email }, { username }],
            },
        });

        if (existingUser) {
            if (existingUser.email === email) {
                throw new ApiError('Пользователь с таким email уже существует', 400);
            }
            if (existingUser.username === username) {
                throw new ApiError('Пользователь с таким именем уже существует', 400);
            }
        }

        // Хеширование пароля
        const hashedPassword = await hash(password, 10);

        // Генерация токена верификации email
        const verificationToken = randomBytes(32).toString('hex');
        const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 часа

        const newUser = await prisma.user.create({
            data: {
                username,
                email,
                hashedPassword,
                verificationToken,
                verificationTokenExpires,
                isVerified: false, // Требуется подтверждение email
                updatedAt: new Date(),
            },
        });

        // Удаляем приватные поля для ответа
        const { hashedPassword: _, verificationToken: __, ...userForResponse } = newUser;

        return NextResponse.json(
            {
                message: 'Пользователь успешно зарегистрирован. Проверьте email для подтверждения.',
                user: userForResponse,
            },
            { status: 201 }
        );
    } catch (error) {
        return handleApiError(error);
    }
}
