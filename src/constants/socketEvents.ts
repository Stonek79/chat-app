// src/constants/socketEvents.ts

// События подключения/отключения (стандартные, но можно вынести для единообразия)
export const SOCKET_EVENT_CONNECT = 'connect';
export const SOCKET_EVENT_DISCONNECT = 'disconnect';
export const SOCKET_EVENT_CONNECT_ERROR = 'connect_error';
export const SOCKET_EVENT_ERROR = 'error'; // Общее событие для ошибок приложения

// События пространства имен /chat
export const CHAT_NAMESPACE = '/chat';

// Серверные события (слушаются клиентом)
export const SERVER_EVENT_USER_JOINED = 'server:user_joined'; // Пользователь присоединился к чату
export const SERVER_EVENT_USER_LEFT = 'server:user_left'; // Пользователь покинул чат
export const SERVER_EVENT_RECEIVE_MESSAGE = 'server:receive_message'; // Новое сообщение в чате
export const SERVER_EVENT_CHAT_CREATED = 'server:chat_created'; // Уведомление о создании нового чата и добавлении в него
export const SERVER_EVENT_MESSAGES_READ = 'server:messages_read'; // <--- Новое событие
// export const SERVER_EVENT_MESSAGE_UPDATED = 'messageUpdated'; // Сообщение отредактировано (если нужно)
// export const SERVER_EVENT_MESSAGE_DELETED = 'messageDeleted'; // Сообщение удалено (если нужно)
// export const SERVER_EVENT_TYPING = 'typing';               // Пользователь печатает (если нужно)
// export const SERVER_EVENT_STOP_TYPING = 'stopTyping';       // Пользователь перестал печатать (если нужно)

// Клиентские события (отправляются на сервер)
export const CLIENT_EVENT_JOIN_CHAT = 'client:join_chat'; // Клиент хочет присоединиться к чату
export const CLIENT_EVENT_LEAVE_CHAT = 'client:leave_chat'; // Клиент хочет покинуть чат
export const CLIENT_EVENT_SEND_MESSAGE = 'client:send_message'; // Клиент отправляет сообщение
export const CLIENT_EVENT_MARK_AS_READ = 'client:mark_as_read'; // <--- Новое событие
// export const CLIENT_EVENT_EDIT_MESSAGE = 'editMessage';      // Клиент редактирует сообщение (если нужно)
// export const CLIENT_EVENT_DELETE_MESSAGE = 'deleteMessage';    // Клиент удаляет сообщение (если нужно)
// export const CLIENT_EVENT_START_TYPING = 'startTyping';      // Клиент начал печатать (если нужно)
// export const CLIENT_EVENT_STOP_TYPING = 'stopTyping';       // Клиент перестал печатать (если нужно)

// Другие возможные события
// export const SOCKET_EVENT_RECONNECT_ATTEMPT = 'reconnect_attempt';
// export const SOCKET_EVENT_RECONNECTED = 'reconnected';
