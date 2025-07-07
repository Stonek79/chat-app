// Лимиты для пользователей
export const MAX_USERNAME_LENGTH = 30;
export const MIN_USERNAME_LENGTH = 2;
export const MIN_PASSWORD_LENGTH = 6;
export const MAX_PASSWORD_LENGTH = 128;

// Лимиты для сообщений и чатов
export const MAX_MESSAGE_LENGTH = 2000;
export const MAX_CHAT_NAME_LENGTH = 100;
export const MAX_CHAT_PARTICIPANTS = 1000;
export const MAX_CONCURRENT_CHATS = 50;

// Лимиты для файлов
export const MAX_FILE_SIZE_MB = 10;

// Лимиты пагинации
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
export const DEFAULT_MESSAGES_LIMIT = 50;
export const MAX_MESSAGES_LIMIT = 100;

// Настройки кэширования
export const CACHE_TTL_SHORT = 60; // 1 минута
export const CACHE_TTL_MEDIUM = 300; // 5 минут
export const CACHE_TTL_LONG = 3600; // 1 час
