import { useEffect, useRef, useState } from 'react';

import {
    CLIENT_EVENT_JOIN_CHAT,
    CLIENT_EVENT_LEAVE_CHAT,
    SOCKET_EVENT_CONNECT,
    SOCKET_EVENT_DISCONNECT,
} from '@/constants';
import { connectSocket } from '@/lib';
import type { AppSocket } from '@/types';

export interface UseChatSocketReturn {
    socket: AppSocket | null;
    isConnected: boolean;
}

export const useChatSocket = (chatId: string | null): UseChatSocketReturn => {
    const [isConnected, setIsConnected] = useState<boolean>(false);
    const socketRef = useRef<AppSocket | null>(null);

    useEffect(() => {
        console.log(
            '[useChatSocket DEBUG] Socket connection effect RUNNING. Deps - chatId:',
            chatId
        );
        socketRef.current = connectSocket();
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
