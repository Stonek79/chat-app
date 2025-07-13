// Базовые константы приложения
export const APP_NAME = 'Chat App' as const;
export const APP_VERSION = '1.0.0' as const;
export const APP_DESCRIPTION =
    'Современное приложение для чата с поддержкой реального времени' as const;

// API URL константы
export const PUBLIC_APP_API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

// Регулярные выражения для валидации
export const USERNAME_REGEX = /^[a-zA-Z0-9_-]+$/;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Названия cookies
export const AUTH_TOKEN_COOKIE_NAME = 'auth-token';
export const REMEMBER_ME_COOKIE_NAME = 'remember-me';
export const THEME_COOKIE_NAME = 'theme';
export const LANGUAGE_COOKIE_NAME = 'language';
export const AUTH_SOCKET_TOKEN_COOKIE_NAME = 'token';

export const DEFAULT_SERVER_CONFIG = {
    NODE_ENV: 'development',
    REDIS_HOST: 'localhost',
    REDIS_PORT: 6379,
    REDIS_SOCKET_NOTIFICATIONS_CHANNEL: 'socket-notifications',
    SOCKET_PORT: 3001,
    SOCKET_CORS_ORIGIN: 'http://localhost:3000',
    MINIO_ENDPOINT: 'localhost',
    MINIO_PORT: 9000,
    MINIO_USE_SSL: false,
    MINIO_ACCESS_KEY: 'minioadmin',
    MINIO_SECRET_KEY: 'minioadmin',
    MINIO_DEFAULT_BUCKETS: 'avatars,media',
    MEDIA_PUBLIC_URL: 'http://localhost:8080/media',
} as const;
