import { io } from 'socket.io-client';
import type { AppClientSocket } from '../types/events';

export interface SocketClientConfig {
    url: string;
    autoConnect?: boolean;
    timeout?: number;
}

export function createSocketClient(config: SocketClientConfig): AppClientSocket {
    const socket = io(config.url, {
        withCredentials: true,
        autoConnect: config.autoConnect ?? true,
        timeout: config.timeout ?? 20000,
    });

    return socket;
}

export { io };
