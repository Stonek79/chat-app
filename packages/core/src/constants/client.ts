// === КЛИЕНТСКИЕ РОУТЫ ===
export const HOME_PAGE_ROUTE = '/';
export const LOGIN_PAGE_ROUTE = '/login';
export const REGISTER_PAGE_ROUTE = '/register';
export const PROFILE_PAGE_ROUTE = '/profile';
export const CHAT_PAGE_ROUTE = '/chat';
export const CHAT_DETAIL_ROUTE = '/chat/[chatId]';
export const CONFIRM_EMAIL_ROUTE = '/confirm/[token]';
export const RESET_PASSWORD_ROUTE = '/reset-password/[token]';
export const NOT_FOUND_ROUTE = '/404';
export const ADMIN_ROUTE = '/admin';
export const ADMIN_ROUTES_PREFIX = '/admin';
export const ADMIN_DASHBOARD_ROUTE = '/admin/dashboard';
export const ADMIN_TOKEN_COOKIE_NAME = 'admin_token';
export const GUEST_ONLY_ROUTES = [LOGIN_PAGE_ROUTE, REGISTER_PAGE_ROUTE, HOME_PAGE_ROUTE];
export const PUBLIC_ROUTES = [LOGIN_PAGE_ROUTE, REGISTER_PAGE_ROUTE];

// === API РОУТЫ ===
// Аутентификация
export const API_AUTH_LOGIN_ROUTE = '/api/auth/login';
export const API_AUTH_REGISTER_ROUTE = '/api/auth/register';
export const API_AUTH_LOGOUT_ROUTE = '/api/auth/logout';
export const API_AUTH_ME_ROUTE = '/api/auth/me';
export const API_AUTH_CONFIRM_ROUTE_PREFIX = '/api/auth/confirm';
export const API_AUTH_USER_ROUTE = '/api/auth/user';
export const IGNORED_API_PREFIXES = ['api'];

// Пользователи
export const API_USERS_ROUTE = '/api/users';
export const API_USERS_SEARCH_ROUTE = '/api/users/search';
export const API_USERS_ONLINE_ROUTE = '/api/users/online';

// Чаты
export const API_CHATS_ROUTE = '/api/chats';
export const API_CHATS_CREATE_ROUTE = '/api/chats/create';

// Сообщения
export const API_MESSAGES_ROUTE = '/api/messages';
export const API_MESSAGES_FORWARD_ROUTE = '/api/messages/forward';

// Файлы
export const API_FILES_UPLOAD_ROUTE = '/api/files/upload';
export const API_FILES_AVATAR_ROUTE = '/api/files/avatar';

// Администрирование
export const API_ADMIN_DASHBOARD_ROUTE = '/api/admin/dashboard';
export const API_ADMIN_USERS_ROUTE = '/api/admin/users';
export const API_ADMIN_CHATS_ROUTE = '/api/admin/chats';
export const API_ADMIN_MESSAGES_ROUTE = '/api/admin/messages';

// === SOCKET СОБЫТИЯ ===
// Подключение
export const SOCKET_EVENT_CONNECT = 'connect';
export const SOCKET_EVENT_DISCONNECT = 'disconnect';

// Сообщения
export const CLIENT_EVENT_SEND_MESSAGE = 'message:send';
export const SERVER_EVENT_RECEIVE_MESSAGE = 'message:receive';
export const CLIENT_EVENT_EDIT_MESSAGE = 'message:edit';
export const SERVER_EVENT_MESSAGE_DELETED = 'message:delete';
export const CLIENT_EVENT_MARK_AS_READ = 'message:read';
export const SERVER_EVENT_MESSAGES_READ = 'message:read';

// Чаты
export const CLIENT_EVENT_JOIN_CHAT = 'chat:join';
export const CLIENT_EVENT_LEAVE_CHAT = 'chat:leave';
export const SERVER_EVENT_CHAT_CREATED = 'chat:update';

// Статус печати
export const CLIENT_EVENT_TYPING_START = 'typing:start';
export const CLIENT_EVENT_TYPING_STOP = 'typing:stop';

// Онлайн статус
export const SERVER_EVENT_USER_JOINED = 'user:online';
export const SERVER_EVENT_USER_LEFT = 'user:offline';

// Уведомления
export const SERVER_EVENT_NOTIFICATION = 'notification';

// Ошибки
export const SOCKET_EVENT_ERROR = 'error';

// === SOCKET НАСТРОЙКИ ===
export const SOCKET_NAMESPACE = '/chat';

// === СЛУЖЕБНЫЕ КОНСТАНТЫ (объектные для удобства) ===

// Ключи для localStorage
export const STORAGE_KEYS = {
    AUTH_TOKEN: 'auth_token',
    USER_PREFERENCES: 'user_preferences',
    CHAT_DRAFTS: 'chat_drafts',
    THEME: 'theme',
    LANGUAGE: 'language',
    NOTIFICATION_SETTINGS: 'notification_settings',
} as const;

// Ключи для sessionStorage
export const SESSION_KEYS = {
    CURRENT_CHAT: 'current_chat',
    SCROLL_POSITION: 'scroll_position',
    FORM_DATA: 'form_data',
} as const;

// Query keys для react-query/tanstack-query
export const QUERY_KEYS = {
    // Пользователи
    USER: ['user'],
    USER_BY_ID: (id: string) => ['user', id],
    USER_PROFILE: ['user', 'profile'],
    USERS_ONLINE: ['users', 'online'],

    // Чаты
    CHATS: ['chats'],
    CHAT_BY_ID: (id: string) => ['chat', id],
    CHAT_PARTICIPANTS: (chatId: string) => ['chat', chatId, 'participants'],

    // Сообщения
    MESSAGES: (chatId: string) => ['messages', chatId],
    MESSAGE_BY_ID: (id: string) => ['message', id],

    // Поиск
    SEARCH_USERS: (query: string) => ['search', 'users', query],
    SEARCH_CHATS: (query: string) => ['search', 'chats', query],
    SEARCH_MESSAGES: (chatId: string, query: string) => ['search', 'messages', chatId, query],
} as const;

// Настройки по умолчанию
export const DEFAULT_SETTINGS = {
    THEME: 'light',
    LANGUAGE: 'ru',
    NOTIFICATIONS_ENABLED: true,
    SOUND_ENABLED: true,
    DESKTOP_NOTIFICATIONS: true,
    MESSAGE_PREVIEW: true,
    AUTO_SCROLL: true,
    ENTER_TO_SEND: true,
} as const;

// === ДИНАМИЧЕСКИЕ РОУТЫ (функции) ===
export const getUserRoute = (id: string) => `/api/users/${id}`;
export const getChatRoute = (id: string) => `/api/chats/${id}`;
export const getChatParticipantsRoute = (chatId: string) => `/api/chats/${chatId}/participants`;
export const getChatMessagesRoute = (chatId: string) => `/api/chats/${chatId}/messages`;
export const getMessageRoute = (id: string) => `/api/messages/${id}`;
export const getMessageEditRoute = (id: string) => `/api/messages/${id}`;
export const getMessageDeleteRoute = (id: string) => `/api/messages/${id}`;
export const getMessageReadRoute = (id: string) => `/api/messages/${id}/read`;
export const getChatDetailRoute = (chatId: string) => `/chat/${chatId}`;
export const getConfirmEmailRoute = (token: string) => `/confirm/${token}`;
export const getResetPasswordRoute = (token: string) => `/reset-password/${token}`;
export const getAuthConfirmRoute = (token: string) => `/api/auth/confirm/${token}`;
