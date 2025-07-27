import { useEffect, useState } from 'react';
import { getSocket } from '@chat-app/socket-shared';
import { SOCKET_EVENT_CONNECT, SOCKET_EVENT_DISCONNECT } from '@chat-app/core';

export const useSocketConnection = (): { isConnected: boolean } => {
    const [isConnected, setIsConnected] = useState(() => getSocket().connected);

    useEffect(() => {
        const socket = getSocket();
        const handleConnect = () => setIsConnected(true);
        const handleDisconnect = () => setIsConnected(false);

        socket.on(SOCKET_EVENT_CONNECT, handleConnect);
        socket.on(SOCKET_EVENT_DISCONNECT, handleDisconnect);

        return () => {
            socket.off(SOCKET_EVENT_CONNECT, handleConnect);
            socket.off(SOCKET_EVENT_DISCONNECT, handleDisconnect);
        };
    }, []); // <--- ПУСТОЙ МАССИВ. ЗАПУСКАЕТСЯ 1 РАЗ.

    return { isConnected };
};
