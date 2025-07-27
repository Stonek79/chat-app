// UI константы - цвета, форматы, статусы

// Цветовая палитра для аватаров
export const AVATAR_COLORS = [
    '#FF6B6B',
    '#4ECDC4',
    '#45B7D1',
    '#96CEB4',
    '#FECA57',
    '#FF9FF3',
    '#54A0FF',
    '#5F27CD',
    '#00D2D3',
    '#FF9F43',
    '#FECA57',
    '#48CAE4',
    '#FF6B6B',
    '#C44569',
    '#F8B500',
] as const;

// Форматы файлов
export const SUPPORTED_IMAGE_FORMATS = ['jpg', 'jpeg', 'png', 'gif', 'webp'] as const;
export const SUPPORTED_VIDEO_FORMATS = ['mp4', 'webm', 'ogg'] as const;
export const SUPPORTED_AUDIO_FORMATS = ['mp3', 'wav', 'ogg', 'flac'] as const;
export const SUPPORTED_DOCUMENT_FORMATS = ['pdf', 'doc', 'docx', 'txt', 'rtf'] as const;

// Статусы подключения
export const CONNECTION_STATUS = {
    CONNECTING: 'connecting',
    CONNECTED: 'connected',
    DISCONNECTED: 'disconnected',
    RECONNECTING: 'reconnecting',
    ERROR: 'error',
} as const;

export const MESSAGE_DELETION_WINDOW_MINUTES = 15;
