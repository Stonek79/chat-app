// src/constants/socketEvents.ts

// События подключения/отключения (стандартные, но можно вынести для единообразия)
export const SOCKET_EVENT_CONNECT = 'connect';
export const SOCKET_EVENT_DISCONNECT = 'disconnect';
export const SOCKET_EVENT_CONNECT_ERROR = 'connect_error';

// События пространства имен /chat
export const CHAT_NAMESPACE = '/chat';

// Серверные события (слушаются клиентом)
export const SERVER_EVENT_USER_JOINED = 'userJoined'; // Пользователь присоединился к чату
export const SERVER_EVENT_USER_LEFT = 'userLeft'; // Пользователь покинул чат
export const SERVER_EVENT_RECEIVE_MESSAGE = 'receiveMessage'; // Новое сообщение в чате
// export const SERVER_EVENT_MESSAGE_UPDATED = 'messageUpdated'; // Сообщение отредактировано (если нужно)
// export const SERVER_EVENT_MESSAGE_DELETED = 'messageDeleted'; // Сообщение удалено (если нужно)
// export const SERVER_EVENT_TYPING = 'typing';               // Пользователь печатает (если нужно)
// export const SERVER_EVENT_STOP_TYPING = 'stopTyping';       // Пользователь перестал печатать (если нужно)

// Клиентские события (отправляются на сервер)
export const CLIENT_EVENT_JOIN_CHAT = 'joinChat'; // Клиент хочет присоединиться к чату
export const CLIENT_EVENT_LEAVE_CHAT = 'leaveChat'; // Клиент хочет покинуть чат
export const CLIENT_EVENT_SEND_MESSAGE = 'sendMessage'; // Клиент отправляет сообщение
// export const CLIENT_EVENT_EDIT_MESSAGE = 'editMessage';      // Клиент редактирует сообщение (если нужно)
// export const CLIENT_EVENT_DELETE_MESSAGE = 'deleteMessage';    // Клиент удаляет сообщение (если нужно)
// export const CLIENT_EVENT_START_TYPING = 'startTyping';      // Клиент начал печатать (если нужно)
// export const CLIENT_EVENT_STOP_TYPING = 'stopTyping';       // Клиент перестал печатать (если нужно)

// Другие возможные события
// export const SOCKET_EVENT_ERROR = 'error'; // Общая ошибка сокета
// export const SOCKET_EVENT_RECONNECT_ATTEMPT = 'reconnect_attempt';
// export const SOCKET_EVENT_RECONNECTED = 'reconnected';
