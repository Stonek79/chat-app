import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { initChatNamespace } from './namespaces';
import { PUBLIC_APP_API_URL, SOCKET_IO_PATH } from '@/constants';
import { pubClient, subClient } from '@/lib';

let io: SocketIOServer;

interface SocketServer extends HttpServer {
    io?: SocketIOServer;
}

export interface SocketWithUser extends Socket {
    user?: { id: string; email: string; role: string };
}

export const initSocketIO = (httpServer: SocketServer) => {
    if (!httpServer.io) {
        if (!pubClient || !subClient) {
            console.error(
                'CRITICAL: Redis pubClient or subClient is not initialized. Socket.IO server will not start with Redis adapter. Check REDIS_URL.'
            );
            return null; // Не инициализируем io, если клиенты Redis недоступны
        }

        console.log('Инициализация нового экземпляра Socket.IO сервера...');
        io = new SocketIOServer(httpServer, {
            path: SOCKET_IO_PATH, // Используем константу
            addTrailingSlash: false,
            cors: {
                origin: PUBLIC_APP_API_URL, // Используем константу
                methods: ['GET', 'POST'],
                credentials: true,
            },
        });

        // Подключение Redis Adapter
        try {
            io.adapter(createAdapter(pubClient, subClient));
            console.log('Socket.IO Redis adapter подключен успешно.');
        } catch (error) {
            console.error('CRITICAL: Не удалось подключить Socket.IO Redis adapter:', error);
            // В этом случае сервер Socket.IO запустится без адаптера,
            // что приведет к проблемам в многоинстансовой среде.
            // Рассмотрите возможность не запускать io или остановить приложение.
            // Для простоты пока просто логируем и позволяем io запуститься без адаптера.
        }

        // Инициализация пространств имен (middleware аутентификации теперь внутри chatNamespace)
        initChatNamespace(io);

        httpServer.io = io;
        console.log('Socket.IO сервер инициализирован и подключен к HTTP серверу.');
    } else {
        console.log('Socket.IO сервер уже инициализирован.');
    }
    return httpServer.io;
};

export { io };
