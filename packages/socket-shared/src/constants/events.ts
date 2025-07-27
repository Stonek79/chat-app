// Socket.IO события константы
export const SOCKET_EVENT_CONNECT = 'connect';
export const SOCKET_EVENT_DISCONNECT = 'disconnect';
export const SOCKET_EVENT_ERROR = 'error';

// События пространства имен /chat
export const CHAT_NAMESPACE = '/chat';

// Серверные события (слушаются клиентом)
export const SERVER_EVENT_USER_JOINED = 'server:user_joined';
export const SERVER_EVENT_USER_LEFT = 'server:user_left';
export const SERVER_EVENT_RECEIVE_MESSAGE = 'server:receive_message';
export const SERVER_EVENT_CHAT_CREATED = 'server:chat_created';

export const SERVER_EVENT_MESSAGES_READ = 'server:messages_read';
export const SERVER_EVENT_MESSAGE_DELETED = 'server:message_deleted';
export const SERVER_EVENT_MESSAGE_EDITED = 'server:message_edited';
export const SERVER_EVENT_MESSAGE_PURGED = 'server:message_purged';
// Клиентские события (отправляются на сервер)
export const CLIENT_EVENT_JOIN_CHAT = 'client:join_chat';
export const CLIENT_EVENT_LEAVE_CHAT = 'client:leave_chat';
export const CLIENT_EVENT_SEND_MESSAGE = 'client:send_message';
export const CLIENT_EVENT_EDIT_MESSAGE = 'client:edit_message';
export const CLIENT_EVENT_MARK_AS_READ = 'client:mark_as_read';
