// Сообщения валидации на русском языке
export const VALIDATION_MESSAGES = {
    REQUIRED: 'Это поле обязательно',
    INVALID_EMAIL: 'Некорректный email адрес',
    INVALID_USERNAME: 'Имя пользователя может содержать только буквы, цифры, _ и -',
    INVALID_PASSWORD:
        'Пароль должен содержать хотя бы одну строчную букву, одну заглавную букву и одну цифру',
    INVALID_URL: 'Некорректный URL',
    INVALID_IMAGE_URL: 'Некорректный URL изображения',
    INVALID_MEDIA_URL: 'Некорректный URL медиа файла',
    PASSWORD_REQUIRED: 'Пароль обязателен',

    USERNAME_TOO_SHORT: 'Имя пользователя должно содержать минимум 3 символа',
    USERNAME_TOO_LONG: 'Имя пользователя не может быть длиннее 30 символов',

    PASSWORD_TOO_SHORT: 'Пароль должен содержать минимум 6 символов',
    PASSWORD_TOO_LONG: 'Пароль слишком длинный',

    EMAIL_TOO_LONG: 'Email слишком длинный',

    MESSAGE_EMPTY: 'Сообщение не может быть пустым',
    MESSAGE_TOO_LONG: 'Сообщение слишком длинное',

    CHAT_NAME_EMPTY: 'Название чата не может быть пустым',
    CHAT_NAME_TOO_LONG: 'Название чата слишком длинное',

    INVALID_CHAT_PARAMS: 'Некорректные параметры чата',
    INVALID_MESSAGE_PARAMS: 'Некорректные параметры сообщения',

    TOO_MANY_PARTICIPANTS: 'Слишком много участников',
    TOO_MANY_CHATS_FOR_FORWARD: 'Слишком много чатов для пересылки',

    NO_PARTICIPANTS: 'Чат должен содержать хотя бы одного участника',
    NO_CHATS_SELECTED: 'Выберите хотя бы один чат для пересылки',
    NO_UPDATE_FIELDS: 'Необходимо указать хотя бы одно поле для обновления',

    TOKEN_REQUIRED: 'Токен обязателен',
    TOKEN_VERIFICATION_REQUIRED: 'Токен подтверждения обязателен',

    FILE_TOO_LARGE: 'Файл слишком большой',
    UNSUPPORTED_FILE_TYPE: 'Неподдерживаемый тип файла',
} as const;

// Коды ошибок
export const ERROR_CODES = {
    // Аутентификация
    INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
    TOKEN_EXPIRED: 'TOKEN_EXPIRED',
    TOKEN_INVALID: 'TOKEN_INVALID',
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',

    // Пользователи
    USER_NOT_FOUND: 'USER_NOT_FOUND',
    USER_ALREADY_EXISTS: 'USER_ALREADY_EXISTS',
    USERNAME_TAKEN: 'USERNAME_TAKEN',
    EMAIL_TAKEN: 'EMAIL_TAKEN',

    // Чаты
    CHAT_NOT_FOUND: 'CHAT_NOT_FOUND',
    CHAT_ACCESS_DENIED: 'CHAT_ACCESS_DENIED',
    PARTICIPANT_NOT_FOUND: 'PARTICIPANT_NOT_FOUND',
    ALREADY_PARTICIPANT: 'ALREADY_PARTICIPANT',

    // Сообщения
    MESSAGE_NOT_FOUND: 'MESSAGE_NOT_FOUND',
    MESSAGE_EDIT_DENIED: 'MESSAGE_EDIT_DENIED',
    MESSAGE_DELETE_DENIED: 'MESSAGE_DELETE_DENIED',

    // Общие
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    NOT_FOUND: 'NOT_FOUND',
    BAD_REQUEST: 'BAD_REQUEST',

    // Файлы
    FILE_UPLOAD_ERROR: 'FILE_UPLOAD_ERROR',
    FILE_NOT_FOUND: 'FILE_NOT_FOUND',

    // Сеть
    NETWORK_ERROR: 'NETWORK_ERROR',
    TIMEOUT_ERROR: 'TIMEOUT_ERROR',
    CONNECTION_ERROR: 'CONNECTION_ERROR',
} as const;

// HTTP статус коды
export const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
    BAD_GATEWAY: 502,
    SERVICE_UNAVAILABLE: 503,
} as const;

// Правила валидации
export const VALIDATION_RULES = {
    USERNAME: {
        minLength: 3,
        maxLength: 30,
        pattern: /^[a-zA-Z0-9_-]+$/,
    },
    PASSWORD: {
        minLength: 6,
        maxLength: 128,
        pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    },
    EMAIL: {
        maxLength: 254,
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    MESSAGE: {
        maxLength: 4000,
    },
    CHAT_NAME: {
        maxLength: 100,
    },
    FILE_SIZE: {
        maxSize: 10 * 1024 * 1024, // 10MB
        maxAvatarSize: 2 * 1024 * 1024, // 2MB
    },
} as const;

// UI константы
export const UI_MESSAGES = {
    UNKNOWN_USER: 'Неизвестный пользователь',
    UNNAMED_CHAT: 'Чат без названия',
    DELETED_MESSAGE: 'Сообщение удалено',
    MEDIA_MESSAGE: 'Медиа сообщение',
    IMAGE_MESSAGE: 'Изображение',
    VIDEO_MESSAGE: 'Видео',
    AUDIO_MESSAGE: 'Аудио',
    FILE_MESSAGE: 'Файл',
    SYSTEM_MESSAGE: 'Системное сообщение',
    URL_MESSAGE: 'Ссылка',
    AVATAR_UPLOAD_ERROR_TITLE: 'Ошибка загрузки аватара',
    AVATAR_UPLOAD_FAILED: 'Не удалось загрузить аватар',
    UNKNOWN_ERROR: 'Неизвестная ошибка',
} as const;

// Типы действий пользователя
export const USER_ACTIONS = {
    EDIT_CHAT: 'EDIT_CHAT',
    DELETE_CHAT: 'DELETE_CHAT',
    ADD_PARTICIPANT: 'ADD_PARTICIPANT',
    REMOVE_PARTICIPANT: 'REMOVE_PARTICIPANT',
    CHANGE_ROLE: 'CHANGE_ROLE',
} as const;

// Роли по умолчанию
export const DEFAULT_ROLES = {
    MEMBER: 'MEMBER',
    ADMIN: 'ADMIN',
    OWNER: 'OWNER',
} as const;

// Типы действий с сообщениями
export const MESSAGE_ACTION_TYPES = {
    EDITED: 'EDITED',
    DELETED: 'DELETED',
    FORWARDED: 'FORWARDED',
    PINNED: 'PINNED',
    UNPINNED: 'UNPINNED',
} as const;
