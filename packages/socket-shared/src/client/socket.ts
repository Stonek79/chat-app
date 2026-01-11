import { io } from 'socket.io-client';
import type { AppClientSocket } from '../types';
import { CHAT_NAMESPACE } from '../constants/events';

let socket: AppClientSocket;

function createSocket() {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3003';
    
    // Ensure we connect to the chat namespace
    const namespaceUrl = socketUrl.endsWith(CHAT_NAMESPACE) 
        ? socketUrl 
        : `${socketUrl}${CHAT_NAMESPACE}`;

    if (!socket) {
        console.log(`[Socket.IO] Creating new client connection to ${namespaceUrl}`);
        socket = io(namespaceUrl, {
            withCredentials: true,
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });
    }
    return socket;
}

export function getSocket(): AppClientSocket {
    return createSocket();
}
 
export { io };
