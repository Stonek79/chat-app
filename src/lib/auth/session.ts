'use server';

import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import jwt from 'jsonwebtoken';

import { AUTH_TOKEN_COOKIE_NAME } from '@/constants';
import type { AppJWTPayload, AuthenticatedUser } from '@/types';

import { ApiError } from '../api';

/**
 * Извлекает и верифицирует JWT из cookie запроса,
 * возвращая данные аутентифицированного пользователя или null.
 * Не выбрасывает ошибку, чтобы можно было использовать в middleware или необязательно защищенных роутах.
 * @param req NextRequest
 * @returns Promise<AuthenticatedUser | null>
 */
export async function getCurrentUser(req: NextRequest): Promise<AuthenticatedUser | null> {
    const tokenCookie = req.cookies.get(AUTH_TOKEN_COOKIE_NAME);

    if (!tokenCookie) {
        console.log(
            `getCurrentUser: Cookie with name "${AUTH_TOKEN_COOKIE_NAME}" NOT FOUND in req.cookies`
        );
        return null;
    }

    const token = tokenCookie.value;
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
        console.error('getCurrentUser: JWT_SECRET не определен в .env');
        return null;
    }

    try {
        // Используем AppJWTPayload для строгой типизации
        const decoded = jwt.verify(token, jwtSecret);

        if (typeof decoded === 'string') {
            console.warn('getCurrentUser: Ошибка верификации JWT: decoded is string');
            return null;
        }

        return {
            id: decoded.userId,
            email: decoded.email,
            username: decoded.username,
            role: decoded.role,
        };
    } catch (jwtError) {
        console.warn('getCurrentUser: Ошибка верификации JWT (jsonwebtoken):', jwtError);
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

/**
 * Извлекает и верифицирует JWT из cookie в Server Component,
 * возвращая данные аутентифицированного пользователя (AuthenticatedUser) или null.
 * Использует 'jose' для верификации, совместимой с Edge Runtime.
 * @returns Promise<AuthenticatedUser | null>
 */
export async function getCurrentUserFromSessionCookie(): Promise<AuthenticatedUser | null> {
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get(AUTH_TOKEN_COOKIE_NAME);

    if (!tokenCookie) {
        return null;
    }

    const token = tokenCookie.value;
    const JWT_SECRET_KEY = process.env.JWT_SECRET;

    if (!JWT_SECRET_KEY) {
        console.error('JWT_SECRET не определен в .env для getCurrentUserFromSessionCookie');
        return null;
    }

    try {
        const secret = new TextEncoder().encode(JWT_SECRET_KEY);
        const { payload } = await jwtVerify<AppJWTPayload>(token, secret);

        return {
            id: payload.userId,
            email: payload.email,
            username: payload.username,
            role: payload.role,
        };
    } catch (error: unknown) {
        console.warn(
            'JWT verification failed in getCurrentUserFromSessionCookie:',
            error instanceof Error ? error.message : 'Unknown error'
        );
        return null;
    }
}
