import { useEffect, useRef, useState } from 'react';
import { parse as parseCookie } from 'cookie';
import type { AppClientSocket } from '@chat-app/socket-shared';
import { CLIENT_EVENT_JOIN_CHAT, CLIENT_EVENT_LEAVE_CHAT } from '@chat-app/socket-shared';
import { AUTH_TOKEN_COOKIE_NAME, SOCKET_EVENT_CONNECT, SOCKET_EVENT_DISCONNECT } from '@chat-app/core';
import { createSocketClient } from '@chat-app/socket-shared';

export interface UseChatSocketReturn {
    socket: AppClientSocket | null;
    isConnected: boolean;
}

export const useChatSocket = (chatId: string | null): UseChatSocketReturn => {
    const [isConnected, setIsConnected] = useState<boolean>(false);
    const socketRef = useRef<AppClientSocket | null>(null);

    useEffect(() => {
        console.log(
            '[useChatSocket DEBUG] Socket connection effect RUNNING. Deps - chatId:',
            chatId
        );

        // Создаем новый socket клиент
        const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001/chat";
    
        const socket = createSocketClient({
            url: socketUrl,
            autoConnect: true,
            timeout: 20000,
        });

        socketRef.current = socket;
        const currentSocket = socketRef.current;

        if (currentSocket) {
            setIsConnected(currentSocket.connected);

            const handleConnect = () => {
                console.log('[useChatSocket] Socket connected');
                setIsConnected(true);
                if (chatId) {
                    console.log(`[useChatSocket] Re-joining chat room ${chatId} after connect.`);
                    currentSocket.emit(CLIENT_EVENT_JOIN_CHAT, chatId);
                }
            };

            const handleDisconnect = (reason: string) => {
                console.log(`[useChatSocket] Socket disconnected, reason: ${reason}`);
                setIsConnected(false);
            };

            currentSocket.on(SOCKET_EVENT_CONNECT, handleConnect);
            currentSocket.on(SOCKET_EVENT_DISCONNECT, handleDisconnect);

            if (currentSocket.connected && chatId) {
                console.log(
                    `[useChatSocket] Socket already connected, joining chat room ${chatId}.`
                );
                currentSocket.emit(CLIENT_EVENT_JOIN_CHAT, chatId);
            }

            return () => {
                console.log('[useChatSocket] Cleaning up socket connection effect.');
                currentSocket.off(SOCKET_EVENT_CONNECT, handleConnect);
                currentSocket.off(SOCKET_EVENT_DISCONNECT, handleDisconnect);
            };
        }

        // Если currentSocket не создался, все равно нужно вернуть cleanup функцию
        return () => {
            console.log('[useChatSocket] Cleanup - no socket created');
        };
    }, [chatId]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            const currentSocket = socketRef.current;
            if (currentSocket && chatId) {
                currentSocket.emit(CLIENT_EVENT_LEAVE_CHAT, chatId);
            }
        };
    }, [chatId]);

    return {
        socket: socketRef.current,
        isConnected,
    };
};
