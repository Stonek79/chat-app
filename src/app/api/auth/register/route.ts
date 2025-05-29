import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
// import jwt from 'jsonwebtoken'; // Пока не используется для JWT, только для токена верификации
import { randomBytes } from 'crypto';
import { handleApiError, ApiError, prisma } from '@/lib';

// Схема валидации для регистрации
const registerSchema = z.object({
    username: z.string().min(3, 'Имя пользователя должно содержать минимум 3 символа').max(30),
    email: z.string().email('Некорректный email'),
    password: z.string().min(6, 'Пароль должен содержать минимум 6 символов'),
});

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Регистрация нового пользователя
 *     tags: [Auth]
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
 *                 minLength: 3
 *                 maxLength: 30
 *                 example: johndoe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john.doe@example.com
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: strongpassword123
 *     responses:
 *       201:
 *         description: Регистрация успешна. Пользователю отправлено письмо для подтверждения email.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Регистрация успешна. Пожалуйста, подтвердите ваш email.
 *       400:
 *         description: Ошибка валидации данных.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Пользователь с таким email или именем пользователя уже существует.
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
        const validation = registerSchema.safeParse(body);

        if (!validation.success) {
            // Используем ApiError для структурированной ошибки валидации
            throw new ApiError(
                'Ошибка валидации данных',
                400,
                validation.error.flatten().fieldErrors
            );
        }

        const { username, email, password } = validation.data;

        // Проверка, существует ли пользователь с таким email или username
        const existingUserByEmail = await prisma.user.findUnique({ where: { email } });
        if (existingUserByEmail) {
            throw new ApiError('Пользователь с таким email уже существует', 409);
        }

        const existingUserByUsername = await prisma.user.findUnique({ where: { username } });
        if (existingUserByUsername) {
            throw new ApiError('Пользователь с таким именем уже существует', 409);
        }

        // Хеширование пароля
        const hashedPassword = await bcrypt.hash(password, 10);

        // Генерация токена верификации email
        // Вместо JWT для email верификации можно использовать простой случайный токен,
        // хранящийся в БД, чтобы избежать сложностей с JWT для одноразовых ссылок.
        const verificationToken = randomBytes(32).toString('hex');
        const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 часа

        const user = await prisma.user.create({
            data: {
                username,
                email,
                hashedPassword,
                verificationToken,
                verificationTokenExpires,
                isVerified: false, // Пользователь не верифицирован при регистрации
            },
        });

        // TODO: Реализовать отправку email с ссылкой для верификации
        // Пока просто выводим в консоль для разработки
        const confirmationLink = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/auth/confirm/${verificationToken}`;
        console.log('Ссылка для подтверждения email:', confirmationLink);
        console.log('Пользователь для подтверждения:', user.email, 'Токен:', verificationToken);

        // Не отправляем JWT сразу после регистрации, ждем подтверждения email
        return NextResponse.json(
            { message: 'Регистрация успешна. Пожалуйста, подтвердите ваш email.' },
            { status: 201 }
        );
    } catch (error) {
        // Передаем ошибку в наш кастомный обработчик
        if (error instanceof z.ZodError) {
            // ZodError обрабатывается внутри handleApiError если мы прокидываем его как есть,
            // но если мы создали ApiError на его основе, то он пойдет по ветке error instanceof Error
            // Чтобы ZodError обработался специфично, можно сделать так:
            return handleApiError(error);
        }
        if (error instanceof ApiError) {
            return handleApiError(error, {
                status: error.status,
                message: error.message,
                errors: error.errors,
            });
        }
        // Для всех остальных непредвиденных ошибок
        return handleApiError(error, { message: 'Внутренняя ошибка сервера при регистрации' });
    }
}
