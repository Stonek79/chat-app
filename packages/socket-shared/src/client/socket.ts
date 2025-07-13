import { io } from 'socket.io-client';
import type { AppClientSocket } from '../types';

let socket: AppClientSocket;

function createSocket() {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

    if (!socket) {
        console.log(`[Socket.IO] Creating new client connection to ${socketUrl}`);
        socket = io(socketUrl, {
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
