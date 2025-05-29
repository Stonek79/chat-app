import { io, Socket } from 'socket.io-client';
import {
    PUBLIC_APP_API_URL,
    SOCKET_IO_PATH,
    CHAT_NAMESPACE,
    SOCKET_EVENT_CONNECT,
    SOCKET_EVENT_DISCONNECT,
    SOCKET_EVENT_CONNECT_ERROR,
    CLIENT_EVENT_JOIN_CHAT,
    CLIENT_EVENT_LEAVE_CHAT,
    CLIENT_EVENT_SEND_MESSAGE,
    SERVER_EVENT_RECEIVE_MESSAGE,
    SERVER_EVENT_USER_JOINED,
    SERVER_EVENT_USER_LEFT,
} from '@/constants';
import type {
    SocketMessagePayload,
    SocketUserPresencePayload,
    ClientSendMessagePayload,
} from '@/types';

let chatSocketInstance: Socket | null = null;

export const getChatSocket = (): Socket | null => {
    if (!chatSocketInstance) {
        try {
            const socketURL = `${PUBLIC_APP_API_URL}${CHAT_NAMESPACE}`;
            console.log(`Попытка подключения к Socket.IO: ${socketURL} с путем ${SOCKET_IO_PATH}`);

            const newSocket = io(socketURL, {
                path: SOCKET_IO_PATH,
                withCredentials: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 3000,
                timeout: 10000,
            });

            newSocket.on(SOCKET_EVENT_CONNECT, () => {
                console.log(
                    `Успешно подключено к Socket.IO неймспейсу: ${CHAT_NAMESPACE}, ID сокета: ${newSocket.id}`
                );
            });

            newSocket.on(SOCKET_EVENT_DISCONNECT, reason => {
                console.log(
                    `Отключено от Socket.IO неймспейса: ${CHAT_NAMESPACE}, причина: ${reason}`
                );
                if (reason === 'io server disconnect') {
                    newSocket.connect();
                }
            });

            newSocket.on(SOCKET_EVENT_CONNECT_ERROR, (error: Error & { data?: any }) => {
                console.error(
                    `Ошибка подключения к Socket.IO неймспейсу ${CHAT_NAMESPACE}:`,
                    error.message,
                    error.data || ''
                );
            });

            chatSocketInstance = newSocket;
        } catch (error) {
            console.error('Не удалось инициализировать Socket.IO клиент:', error);
            chatSocketInstance = null;
        }
    }
    return chatSocketInstance;
};

export const emitJoinChat = (chatId: string): void => {
    const socket = getChatSocket();
    socket?.emit(CLIENT_EVENT_JOIN_CHAT, chatId);
};

export const emitLeaveChat = (chatId: string): void => {
    const socket = getChatSocket();
    socket?.emit(CLIENT_EVENT_LEAVE_CHAT, chatId);
};

export const emitSendMessage = (payload: ClientSendMessagePayload): void => {
    const socket = getChatSocket();
    if (socket?.connected) {
        socket.emit(CLIENT_EVENT_SEND_MESSAGE, payload);
    } else {
        console.warn('Socket не подключен. Не удалось отправить sendMessage.');
    }
};

export const onReceiveMessage = (
    callback: (message: SocketMessagePayload) => void
): (() => void) => {
    const socket = getChatSocket();
    if (socket) {
        socket.on(SERVER_EVENT_RECEIVE_MESSAGE, callback);
        return () => socket.off(SERVER_EVENT_RECEIVE_MESSAGE, callback);
    }
    console.warn('Socket не инициализирован. Не удалось подписаться на receiveMessage.');
    return () => {};
};

export const onUserJoined = (callback: (data: SocketUserPresencePayload) => void): (() => void) => {
    const socket = getChatSocket();
    if (socket) {
        socket.on(SERVER_EVENT_USER_JOINED, callback);
        return () => socket.off(SERVER_EVENT_USER_JOINED, callback);
    }
    console.warn('Socket не инициализирован. Не удалось подписаться на userJoined.');
    return () => {};
};

export const onUserLeft = (callback: (data: SocketUserPresencePayload) => void): (() => void) => {
    const socket = getChatSocket();
    if (socket) {
        socket.on(SERVER_EVENT_USER_LEFT, callback);
        return () => socket.off(SERVER_EVENT_USER_LEFT, callback);
    }
    console.warn('Socket не инициализирован. Не удалось подписаться на userLeft.');
    return () => {};
};

export const disconnectChatSocket = (): void => {
    const socket = getChatSocket();
    if (socket?.connected) {
        socket.disconnect();
        console.log(`Socket.IO клиент отключен от неймспейса ${CHAT_NAMESPACE}`);
    }
};

export const connectChatSocket = (): void => {
    const socket = getChatSocket();
    if (socket && !socket.connected) {
        socket.connect();
    } else if (!socket) {
        console.warn('Не удалось получить экземпляр сокета для подключения.');
    }
};
