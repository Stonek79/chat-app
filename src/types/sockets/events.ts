import type { Socket as SocketIOClientDefault } from 'socket.io-client';

import {
    CLIENT_EVENT_JOIN_CHAT,
    CLIENT_EVENT_LEAVE_CHAT,
    CLIENT_EVENT_MARK_AS_READ,
    CLIENT_EVENT_SEND_MESSAGE,
    SERVER_EVENT_CHAT_CREATED,
    SERVER_EVENT_MESSAGE_DELETED,
    SERVER_EVENT_MESSAGES_READ,
    SERVER_EVENT_RECEIVE_MESSAGE,
    SERVER_EVENT_USER_JOINED,
    SERVER_EVENT_USER_LEFT,
} from '@/constants';

import type {
    ChatParticipantRole,
    ClientChat,
    ClientSendMessagePayload,
    SocketMessagePayload,
} from '../chat';
import type { MessageDeletedPayload } from '../message';
import type { UserRole } from '../user';

export { SocketIOClientDefault };

/**
 * Полезная нагрузка для событий присутствия пользователя (подключился/отключился).
 */
export interface SocketUserPresencePayload {
    chatId: string;
    userId: string;
    email: string;
    role: ChatParticipantRole;
    username: string;
    avatarUrl: string;
}

// ==============================================================================
// ОБЩИЕ ТИПЫ ДЛЯ SOCKET.IO
// ==============================================================================

/**
 * Полезная нагрузка для общих ошибок, отправляемых сервером Socket.IO.
 */
export interface GeneralSocketErrorPayload {
    message: string;
    code?: string | number; // Код ошибки, если есть (например, HTTP-статус или кастомный код)
    details?: Record<string, any>; // Дополнительные детали ошибки
}

// ==============================================================================
// Определения событий для клиента и сервера
// ==============================================================================

/**
 * События, которые КЛИЕНТ отправляет на СЕРВЕР.
 */
export interface ClientToServerEvents {
    [CLIENT_EVENT_JOIN_CHAT]: (chatId: string) => void;
    [CLIENT_EVENT_LEAVE_CHAT]: (chatId: string) => void;
    [CLIENT_EVENT_SEND_MESSAGE]: (
        payload: ClientSendMessagePayload,
        ack?: (response: {
            success: boolean;
            messageId?: string;
            createdAt?: Date;
            error?: string;
        }) => void
    ) => void;
    [CLIENT_EVENT_MARK_AS_READ]: (payload: { chatId: string; lastReadMessageId: string }) => void;
    // Пример другого события, если понадобится:
    // 'client:typing': (data: { chatId: string; isTyping: boolean }) => void;

    // Стандартные события Socket.IO (connect, disconnect, error и т.д.)
    // не нужно здесь определять для отправки клиентом.
}

/**
 * События, которые СЕРВЕР отправляет КЛИЕНТУ.
 */
export interface ServerToClientEvents {
    [SERVER_EVENT_RECEIVE_MESSAGE]: (payload: SocketMessagePayload) => void;
    [SERVER_EVENT_USER_JOINED]: (payload: SocketUserPresencePayload) => void;
    [SERVER_EVENT_USER_LEFT]: (payload: SocketUserPresencePayload) => void;
    [SERVER_EVENT_CHAT_CREATED]: (chat: ClientChat) => void;
    [SERVER_EVENT_MESSAGES_READ]: (payload: {
        chatId: string;
        userId: string;
        lastReadMessageId: string;
        readAt: Date;
    }) => void;
    [SERVER_EVENT_MESSAGE_DELETED]: (payload: MessageDeletedPayload) => void;
    // Пример другого события от сервера:
    // 'server:typing_indicator': (data: { chatId: string; userId: string; isTyping: boolean }) => void;

    // Стандартные события Socket.IO (connect, disconnect, connect_error)
    // клиент слушает автоматически. Их можно добавить сюда для строгой типизации
    // их аргументов, если сервер их кастомизирует, но обычно это не требуется.
    // connect: () => void;
    // disconnect: (reason: SocketIOClientDefault.DisconnectReason) => void;
    // connect_error: (error: Error) => void;

    /**
     * Общее событие для кастомных ошибок, отправляемых сервером.
     * Клиент должен слушать это событие для обработки ошибок приложения.
     */
    error: (errorData: GeneralSocketErrorPayload) => void;
}

// ==============================================================================
// Финальный типизированный экземпляр Socket.IO клиента
// ==============================================================================
export type AppSocket = SocketIOClientDefault<ServerToClientEvents, ClientToServerEvents>;

// ==============================================================================
// Опционально: Типы для серверной стороны Socket.IO
// ==============================================================================

import type { Server as SocketIOServerDefault, Socket as ServerSocketDefault } from 'socket.io';

// Определения для событий между серверами (если используется кластеризация и обмен данными между инстансами)
export interface InterServerEvents {
    ping: () => void;
    // Можно добавить другие события, если они будут использоваться между инстансами socket-сервера
}

/**
 * Данные пользователя, прикрепляемые к экземпляру сокета на сервере после аутентификации.
 * Этот тип должен совпадать с AuthenticatedSocketUserData из authMiddleware.ts.
 */
export interface AuthenticatedSocketUserData {
    userId: string; // Обычно это userId
    email?: string;
    role?: UserRole; // Возвращаем UserRole | undefined
    username?: string;
    avatarUrl?: string;
    // ... другие поля из вашего JWT payload, которые вы хотите видеть в socket.data.user
}

// Определения для пользовательских данных, которые можно хранить в экземпляре сокета на сервере
export interface SocketData {
    user?: AuthenticatedSocketUserData; // Делаем user опциональным, т.к. он появляется после успешной аутентификации
    // Здесь можно добавить другие данные, специфичные для сессии сокета, если необходимо
    // Например: currentRoom: string;
}

// Типизированный серверный сокет (для одного подключенного клиента)
export type AppServerSocket = ServerSocketDefault<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
>;

// Типизированный главный экземпляр Socket.IO сервера
export type AppIoServer = SocketIOServerDefault<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
>;
