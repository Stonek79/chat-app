'use server';

import jwt, { SignOptions } from 'jsonwebtoken';
import { AppJWTPayload } from '@chat-app/core';
import { ApiError } from '@/lib/api';

const JWT_EXPIRATION_TIME: SignOptions['expiresIn'] = process.env.JWT_EXPIRATION_TIME as SignOptions['expiresIn'] || '7d';

/**
 * Создает и подписывает JWT токен.
 * @param payload - Данные для включения в токен.
 * @returns {Promise<string>} - Подписанный JWT токен.
 * @throws {ApiError} - Если секретный ключ JWT не определен.
 */
export async function signJwt(payload: Omit<AppJWTPayload, 'iat' | 'exp'>): Promise<string> {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
        console.error('JWT_SECRET не определен в .env');
        throw new ApiError('Ошибка конфигурации сервера (JWT)', 500);
    }

    return jwt.sign(payload, jwtSecret, { expiresIn: JWT_EXPIRATION_TIME });
}
