import { useEffect, useRef, useState } from 'react';
import type { AppClientSocket } from '@chat-app/socket-shared';
import {
    CLIENT_EVENT_JOIN_CHAT,
    CLIENT_EVENT_LEAVE_CHAT,
    getSocket,
} from '@chat-app/socket-shared';
import { SOCKET_EVENT_CONNECT, SOCKET_EVENT_DISCONNECT } from '@chat-app/core';

export interface UseChatSocketReturn {
    socket: AppClientSocket | null;
    isConnected: boolean;
}

export const useChatSocket = (chatId: string | null): UseChatSocketReturn => {
    const [isConnected, setIsConnected] = useState<boolean>(false);
    const socketRef = useRef<AppClientSocket | null>(null);

    // Эффект для инициализации сокета и подписки на события connect/disconnect
    useEffect(() => {
        // Получаем единственный экземпляр сокета
        const socket = getSocket();
        socketRef.current = socket;
        setIsConnected(socket.connected);

        const handleConnect = () => {
            console.log('[useChatSocket] Socket connected');
            setIsConnected(true);
            // Важно: повторно присоединяемся к комнате после реконнекта
            if (chatId) {
                console.log(`[useChatSocket] Re-joining chat room ${chatId} after connect.`);
                socket.emit(CLIENT_EVENT_JOIN_CHAT, chatId);
            }
        };

        const handleDisconnect = (reason: string) => {
            console.log(`[useChatSocket] Socket disconnected, reason: ${reason}`);
            setIsConnected(false);
        };

        socket.on(SOCKET_EVENT_CONNECT, handleConnect);
        socket.on(SOCKET_EVENT_DISCONNECT, handleDisconnect);

        // Присоединяемся к комнате, если сокет уже подключен
        if (socket.connected && chatId) {
            console.log(`[useChatSocket] Socket already connected, joining chat room ${chatId}.`);
            socket.emit(CLIENT_EVENT_JOIN_CHAT, chatId);
        }

        // Функция очистки
        return () => {
            console.log('[useChatSocket] Cleaning up listeners and leaving room.');
            socket.off(SOCKET_EVENT_CONNECT, handleConnect);
            socket.off(SOCKET_EVENT_DISCONNECT, handleDisconnect);
            // Покидаем комнату при размонтировании или смене chatId
            if (chatId) {
                socket.emit(CLIENT_EVENT_LEAVE_CHAT, chatId);
            }
        };
    }, [chatId]); // Зависимость от chatId, чтобы правильно входить/выходить из комнат

    return {
        socket: socketRef.current,
        isConnected,
    };
};
