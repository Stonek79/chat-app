// Конфигурации для обработки разных типов изображений
export const IMAGE_PROCESSING_PROFILES = {
    AVATAR: {
        maxWidth: 256,
        maxHeight: 256,
        quality: 85,
        format: 'webp' as const,
        fit: 'cover' as const, // Обрезка для точного соответствия размерам
    },
    MESSAGE_IMAGE: {
        maxWidth: 1920,
        maxHeight: 1080,
        quality: 80,
        format: 'webp' as const,
        fit: 'inside' as const, // Вписывание в размеры с сохранением пропорций
    },
} as const;

// Поддерживаемые форматы входных изображений
export const SUPPORTED_INPUT_FORMATS = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/bmp',
    'image/tiff',
] as const;

// Размеры файлов
export const FILE_SIZE_LIMITS = {
    AVATAR: 5 * 1024 * 1024, // 5MB
    MESSAGE_IMAGE: 20 * 1024 * 1024, // 20MB
    THUMBNAIL: 2 * 1024 * 1024, // 2MB
} as const;

// Типы профилей для обработки
export type ImageProcessingProfile = keyof typeof IMAGE_PROCESSING_PROFILES;
export type SupportedInputFormat = (typeof SUPPORTED_INPUT_FORMATS)[number];
 