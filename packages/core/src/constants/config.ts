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
