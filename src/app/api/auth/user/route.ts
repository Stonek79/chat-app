import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { handleApiError, ApiError, prisma, getCurrentUser } from '@/lib';
import { ClientUser } from '@/types';

const updateUserSchema = z.object({
    username: z
        .string()
        .min(3, 'Имя пользователя должно содержать минимум 3 символа')
        .max(30)
        .optional(),
    // email: z.string().email('Некорректный email').optional(), // Если будем обновлять email
});

/**
 * @swagger
 * /api/auth/user:
 *   patch:
 *     summary: Обновление данных аутентифицированного пользователя
 *     tags: [Auth, User]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 30
 *                 description: Новое имя пользователя (опционально).
 *                 example: newjohndoe
 *     responses:
 *       200:
 *         description: Данные пользователя успешно обновлены.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/ClientUser'
 *       400:
 *         description: Ошибка валидации данных или нечего обновлять.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Пользователь не аутентифицирован.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Новое имя пользователя уже занято.
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
export async function PATCH(req: NextRequest) {
    try {
        const currentUser = await getCurrentUser(req);
        if (!currentUser) {
            throw new ApiError('Пользователь не аутентифицирован', 401);
        }

        const body = await req.json();
        const validation = updateUserSchema.safeParse(body);

        if (!validation.success) {
            throw new ApiError(
                'Ошибка валидации данных',
                400,
                validation.error.flatten().fieldErrors
            );
        }

        const { username } = validation.data;

        if (!username) {
            // Если в будущем будут другие поля, нужно будет проверить, что хоть что-то передано
            throw new ApiError('Не указаны данные для обновления', 400);
        }

        // Проверка, если новое имя пользователя уже занято кем-то другим
        if (username && username !== currentUser.username) {
            const existingUserByUsername = await prisma.user.findUnique({
                where: { username },
            });
            if (existingUserByUsername) {
                throw new ApiError('Это имя пользователя уже занято', 409);
            }
        }

        // TODO: Если будем обновлять email, потребуется логика ре-верификации и возможно проверка уникальности нового email

        const updatedUser = await prisma.user.update({
            where: { id: currentUser.userId },
            data: {
                ...(username && { username }),
                // ...(email && { email, isVerified: false, verificationToken: generateNewToken(), verificationTokenExpires: setNewExpiry() }),
            },
        });

        const clientUser: ClientUser = {
            id: updatedUser.id,
            username: updatedUser.username,
            email: updatedUser.email,
            role: updatedUser.role,
            avatarUrl: '',
        };

        return NextResponse.json({ user: clientUser }, { status: 200 });
    } catch (error) {
        if (error instanceof ApiError) {
            return handleApiError(error);
        }
        return handleApiError(error, {
            message: 'Внутренняя ошибка сервера при обновлении пользователя',
        });
    }
}
 