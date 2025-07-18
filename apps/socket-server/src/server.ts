// Основной файл для выделенного Socket.IO сервера.
// Здесь будет инициализация HTTP сервера, Socket.IO, подключение адаптера Redis,
// настройка неймспейсов и обработчиков событий.

import { createServer } from 'http';
import { Server } from 'socket.io';

import { CHAT_NAMESPACE } from '@chat-app/socket-shared';
import type { AppSocketServer } from '@chat-app/socket-shared';
import {
    getServerConfig,
    getRedisClient,
    getSubClient,
    getNotificationSubscriber,
    createSocketRedisAdapter,
} from '@chat-app/server-shared';
import { initializeStorage } from '@chat-app/media-storage';
import { initializeNotificationListener, onConnection } from './handlers';
import { jwtAuthMiddleware } from './middlewares';

const config = getServerConfig();

// --- Инициализация локального хранилища ---
initializeStorage().catch((error: Error) => {
    console.error('Failed to initialize local storage:', error.message);
    process.exit(1);
});

// --- Инициализация HTTP и Socket.IO сервера ---
const httpServer = createServer();
const io: AppSocketServer = new Server(httpServer, {
    cors: {
        origin: config.SOCKET_CORS_ORIGIN.split(','),
        methods: ['GET', 'POST'],
        credentials: true,
    },
});

// --- Настройка Redis Adapter для масштабирования ---
io.adapter(createSocketRedisAdapter(getRedisClient(), getSubClient()));

// --- Инициализация неймспейса /chat ---
const chatNamespace = io.of(CHAT_NAMESPACE);

// Подключаем middleware аутентификации ко всем входящим соединениям в неймспейсе
chatNamespace.use(jwtAuthMiddleware);

// Регистрируем главный обработчик для события 'connection'
chatNamespace.on('connection', socket => onConnection(io, socket));

// --- Инициализация слушателя уведомлений от API через Redis ---
initializeNotificationListener(io);

// --- Запуск сервера ---
httpServer.listen(config.SOCKET_PORT, () => {
    console.log(`✅ Socket.IO server is running on port ${config.SOCKET_PORT}`);
    console.log(`➡️  Allowed CORS origins: ${config.SOCKET_CORS_ORIGIN}`);
    console.log(`➡️  Listening on namespace: ${CHAT_NAMESPACE}`);
});

// --- Обработка сигналов для корректного завершения ---
const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM', 'SIGQUIT'];

function gracefulShutdown(signal: NodeJS.Signals) {
    console.log(`\n🚦 Received ${signal}, shutting down gracefully...`);
    io.close(() => {
        console.log('✅ Socket.IO server closed.');
        getRedisClient().quit(() => console.log('✅ Redis PubClient disconnected.'));
        getSubClient().quit(() => console.log('✅ Redis SubClient disconnected.'));
        getNotificationSubscriber().quit(() =>
            console.log('✅ Redis NotificationSubClient disconnected.')
        );
        httpServer.close(() => {
            console.log('✅ HTTP server closed.');
            process.exit(0);
        });
    });
}

signals.forEach(signal => {
    process.on(signal, () => gracefulShutdown(signal));
});

export { httpServer, io };
