import { getRedisClient } from './client';

/**
 * Сохраняет значение в Redis кэш
 */
export async function setCache(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    const redis = getRedisClient();
    try {
        const valueStr = typeof value === 'string' ? value : JSON.stringify(value);

        if (ttlSeconds) {
            await redis.setex(key, ttlSeconds, valueStr);
        } else {
            await redis.set(key, valueStr);
        }

        // console.log(`[Redis Cache] Set key ${key} ${ttlSeconds ? `with TTL ${ttlSeconds}s` : ''}`);
    } catch (error) {
        console.error(`[Redis Cache] Error setting key ${key}:`, error);
        throw error;
    }
}

/**
 * Получает значение из Redis кэша
 */
export async function getCache<T = unknown>(key: string): Promise<T | null> {
    const redis = getRedisClient();
    try {
        const value = await redis.get(key);

        if (value === null) {
            return null;
        }

        try {
            return JSON.parse(value) as T;
        } catch {
            // Если не JSON, возвращаем как строку
            return value as T;
        }
    } catch (error) {
        console.error(`[Redis Cache] Error getting key ${key}:`, error);
        throw error;
    }
}

/**
 * Удаляет значение из Redis кэша
 */
export async function deleteCache(key: string): Promise<boolean> {
    const redis = getRedisClient();
    try {
        const result = await redis.del(key);
        // console.log(`[Redis Cache] Deleted key ${key}, result: ${result}`);
        return result > 0;
    } catch (error) {
        console.error(`[Redis Cache] Error deleting key ${key}:`, error);
        throw error;
    }
}

/**
 * Проверяет существование ключа в кэше
 */
export async function existsCache(key: string): Promise<boolean> {
    const redis = getRedisClient();
    try {
        const result = await redis.exists(key);
        return result === 1;
    } catch (error) {
        console.error(`[Redis Cache] Error checking existence of key ${key}:`, error);
        throw error;
    }
}

/**
 * Устанавливает TTL для существующего ключа
 */
export async function expireCache(key: string, ttlSeconds: number): Promise<boolean> {
    const redis = getRedisClient();
    try {
        const result = await redis.expire(key, ttlSeconds);
        return result === 1;
    } catch (error) {
        console.error(`[Redis Cache] Error setting TTL for key ${key}:`, error);
        throw error;
    }
}
