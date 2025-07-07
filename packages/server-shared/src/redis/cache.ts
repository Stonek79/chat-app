import type Redis from 'ioredis';
import { getDefaultRedisClients } from './client';

// Получаем клиент для кэша
function getCacheClient(): Redis {
    return getDefaultRedisClients().pubClient;
}

/**
 * Сохраняет значение в Redis кэш
 */
export async function setCache(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    try {
        const cacheClient = getCacheClient();
        const valueStr = typeof value === 'string' ? value : JSON.stringify(value);

        if (ttlSeconds) {
            await cacheClient.setex(key, ttlSeconds, valueStr);
        } else {
            await cacheClient.set(key, valueStr);
        }

        console.log(`[Redis Cache] Set key ${key} ${ttlSeconds ? `with TTL ${ttlSeconds}s` : ''}`);
    } catch (error) {
        console.error(`[Redis Cache] Error setting key ${key}:`, error);
        throw error;
    }
}

/**
 * Получает значение из Redis кэша
 */
export async function getCache<T = unknown>(key: string): Promise<T | null> {
    try {
        const cacheClient = getCacheClient();
        const value = await cacheClient.get(key);

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
    try {
        const cacheClient = getCacheClient();
        const result = await cacheClient.del(key);
        console.log(`[Redis Cache] Deleted key ${key}, result: ${result}`);
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
    try {
        const cacheClient = getCacheClient();
        const result = await cacheClient.exists(key);
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
    try {
        const cacheClient = getCacheClient();
        const result = await cacheClient.expire(key, ttlSeconds);
        return result === 1;
    } catch (error) {
        console.error(`[Redis Cache] Error setting TTL for key ${key}:`, error);
        throw error;
    }
}
