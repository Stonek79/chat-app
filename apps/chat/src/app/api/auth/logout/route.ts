import { NextRequest, NextResponse } from 'next/server';
import { AUTH_TOKEN_COOKIE_NAME } from '@chat-app/core';

import { handleApiError } from '@/lib';

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Выход пользователя из системы
 *     tags: [Auth]
 *     description: Удаляет HttpOnly cookie с JWT токеном, тем самым осуществляя выход пользователя.
 *     responses:
 *       200:
 *         description: Выход успешен.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Выход успешен
 *         headers:
 *           Set-Cookie:
 *             description: Инструктирует браузер удалить cookie (например, `token=; HttpOnly; Path=/; Max-Age=0`).
 *             schema:
 *               type: string
 *       500:
 *         description: Внутренняя ошибка сервера.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export async function POST(req: NextRequest) {
    try {
        // Основная задача logout - это удалить httpOnly cookie с токеном.
        // Мы не можем напрямую удалить cookie из NextRequest на сервере,
        // мы должны отправить ответ, который инструктирует браузер удалить cookie.

        const response = NextResponse.json({ message: 'Выход успешен' }, { status: 200 });

        // Инструкция браузеру удалить cookie 'token'
        // Устанавливаем cookie с тем же именем, пустым значением и истекшим сроком действия (maxAge: 0)
        response.cookies.set(AUTH_TOKEN_COOKIE_NAME, '', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 0, // Важно для удаления cookie
        });

        return response;
    } catch (error) {
        // Хотя операция logout проста, все равно обернем в обработчик ошибок на всякий случай
        return handleApiError(error, { message: 'Внутренняя ошибка сервера при выходе' });
    }
}
