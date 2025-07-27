import type { Server as SocketIOServer, Socket } from 'socket.io';
import type { Socket as ClientSocket } from 'socket.io-client';
import type { SessionData, ChatWithDetails, MessagePayload, ClientMessageAction } from '@chat-app/core';
import type {
    SocketUserPresencePayload,
    GeneralSocketErrorPayload,
    SendMessageAckResponse,
    MessagesReadPayload,
    ClientSendMessagePayload,
    MessageDeletedPayload,
    MessageEditedPayload,
} from './payloads';

// Импорт констант событий Socket.IO
import {
    SERVER_EVENT_USER_JOINED,
    SERVER_EVENT_USER_LEFT,
    SERVER_EVENT_RECEIVE_MESSAGE,
    SERVER_EVENT_CHAT_CREATED,
    SERVER_EVENT_MESSAGES_READ,
    SERVER_EVENT_MESSAGE_DELETED,
    CLIENT_EVENT_JOIN_CHAT,
    CLIENT_EVENT_LEAVE_CHAT,
    CLIENT_EVENT_SEND_MESSAGE,
    CLIENT_EVENT_EDIT_MESSAGE,
    CLIENT_EVENT_MARK_AS_READ,
    SERVER_EVENT_MESSAGE_EDITED,
} from '../constants/events';

/**
 * @description Данные, которые можно прикрепить к сокету.
 */
export interface SocketData {
    user: SessionData;
}

/**
 * @description Типы событий, которые сервер отправляет клиенту.
 */
export interface ServerToClientEvents {
    [SERVER_EVENT_CHAT_CREATED]: (chat: ChatWithDetails) => void;
    [SERVER_EVENT_MESSAGE_DELETED]: (payload: MessageDeletedPayload) => void;
    [SERVER_EVENT_RECEIVE_MESSAGE]: (payload: MessagePayload) => void;
    [SERVER_EVENT_MESSAGES_READ]: (payload: MessagesReadPayload) => void;
    [SERVER_EVENT_USER_JOINED]: (payload: SocketUserPresencePayload) => void;
    [SERVER_EVENT_USER_LEFT]: (payload: SocketUserPresencePayload) => void;
    [SERVER_EVENT_MESSAGE_EDITED]: (payload: MessageEditedPayload) => void;
    error: (payload: GeneralSocketErrorPayload) => void;
}

/**
 * @description Типы событий, которые клиент отправляет серверу.
 */
export interface ClientToServerEvents {
    [CLIENT_EVENT_JOIN_CHAT]: (chatId: string) => void;
    [CLIENT_EVENT_LEAVE_CHAT]: (chatId: string) => void;
    [CLIENT_EVENT_SEND_MESSAGE]: (
        message: ClientSendMessagePayload,
        ack?: (response: SendMessageAckResponse) => void
    ) => void;
    [CLIENT_EVENT_EDIT_MESSAGE]: (payload: {
        chatId: string;
        messageId: string;
        action: ClientMessageAction;
    }) => void;
    [CLIENT_EVENT_MARK_AS_READ]: (payload: { chatId: string; messageId: string }) => void;
}

/**
 * @description Типы событий для межсерверного взаимодействия.
 */
export interface InterServerEvents {
    ping: () => void;
}

export type AppSocket = Socket<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
>;

export type AppClientSocket = ClientSocket<ServerToClientEvents, ClientToServerEvents>;

export type AppSocketServer = SocketIOServer<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
>;
