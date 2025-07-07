'use server';

import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import type { AuthenticatedUser, ClientUser } from '@chat-app/core';
import { AUTH_TOKEN_COOKIE_NAME, appJWTPayloadSchema, toClientUser } from '@chat-app/core';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib';

import { ApiError } from '../api';

/**
 * Извлекает JWT токен из куков запроса
 * @param req - NextRequest объект
 * @returns JWT токен или null, если он не найден
 */
export async function extractToken(req: NextRequest): Promise<string | null> {
    const token = req.cookies.get(AUTH_TOKEN_COOKIE_NAME)?.value;
    return token || null;
}

/**
 * Извлекает JWT токен из серверных куков (для Server Components)
 * @returns JWT токен или null, если он не найден
 */
export async function extractTokenFromServerCookies(): Promise<string | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_TOKEN_COOKIE_NAME)?.value;
    return token || null;
}

/**
 * Валидирует JWT токен и возвращает payload
 * @param token - JWT токен для валидации
 * @returns AuthenticatedUser данные из токена или null, если токен невалиден
 */
export async function validateToken(token: string): Promise<AuthenticatedUser | null> {
    try {
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            console.error('JWT_SECRET не определен в .env');
            return null;
        }

        const decoded = jwt.verify(token, jwtSecret);
        const validationResult = appJWTPayloadSchema.safeParse(decoded);

        if (!validationResult.success) {
            console.error('Невалидный формат JWT payload');
            return null;
        }

        return {
            id: validationResult.data.userId,
            email: validationResult.data.email,
            username: validationResult.data.username,
            role: validationResult.data.role,
            isVerified: true, // Если токен валиден, пользователь верифицирован
        };
    } catch (error) {
        console.error('Ошибка валидации JWT:', error);
        return null;
    }
}

/**
 * Получает текущего пользователя из JWT токена запроса
 * @param req - NextRequest объект
 * @returns AuthenticatedUser данные или null, если пользователь не аутентифицирован
 */
export async function getCurrentUser(req: NextRequest): Promise<AuthenticatedUser | null> {
    const token = await extractToken(req);
    if (!token) {
        return null;
    }

    return validateToken(token);
}

/**
 * Получает текущего пользователя из серверных куков (для Server Components)
 * @returns AuthenticatedUser данные или null, если пользователь не аутентифицирован
 */
export async function getCurrentUserFromSessionCookie(): Promise<AuthenticatedUser | null> {
    const token = await extractTokenFromServerCookies();
    if (!token) {
        return null;
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
        console.error('JWT_SECRET не определен в .env для getCurrentUserFromSessionCookie');
        return null;
    }

    try {
        const decoded = jwt.verify(token, jwtSecret);
        const validationResult = appJWTPayloadSchema.safeParse(decoded);

        if (!validationResult.success) {
            console.error('Невалидный формат JWT payload');
            return null;
        }

        return {
            id: validationResult.data.userId,
            email: validationResult.data.email,
            username: validationResult.data.username,
            role: validationResult.data.role,
            isVerified: true, // Если токен валиден, пользователь верифицирован
        };
    } catch (error) {
        console.error('JWT verification failed in getCurrentUserFromSessionCookie:', error);
        return null;
    }
}

/**
 * Получает полные данные пользователя из БД для UI компонентов
 * @returns ClientUser данные или null, если пользователь не аутентифицирован
 */
export async function getFullUserData(): Promise<ClientUser | null> {
    const authenticatedUser = await getCurrentUserFromSessionCookie();
    if (!authenticatedUser) {
        return null;
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: authenticatedUser.id },
        });

        if (!user) {
            return null;
        }

        return toClientUser(user);
    } catch (error) {
        console.error('Ошибка при получении полных данных пользователя:', error);
        return null;
    }
}

/**
 * Гарантирует, что пользователь аутентифицирован, иначе выбрасывает ApiError.
 * @param req NextRequest
 * @returns Promise<AuthenticatedUser>
 * @throws ApiError если пользователь не аутентифицирован или токен невалиден.
 */
export async function ensureAuthenticated(req: NextRequest): Promise<AuthenticatedUser> {
    const user = await getCurrentUser(req);
    if (!user) {
        throw new ApiError('Пользователь не аутентифицирован', 401);
    }
    return user;
}
