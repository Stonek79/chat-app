// Основной файл для выделенного Socket.IO сервера.
// Здесь будет инициализация HTTP сервера, Socket.IO, подключение адаптера Redis,
// настройка неймспейсов и обработчиков событий.

import { createAdapter } from '@socket.io/redis-adapter';
import { createServer } from 'http';
import { Server } from 'socket.io';

import { CHAT_NAMESPACE } from '#/constants';
import type { AppIoServer } from '#/types';

import { config } from './config';
import { initializeNotificationListener, onConnection } from './handlers';
import { notificationSubscriber, pubClient, subClient } from './lib';
import { jwtAuthMiddleware } from './middlewares';

// --- Инициализация HTTP и Socket.IO сервера ---
const httpServer = createServer();
const io: AppIoServer = new Server(httpServer, {
    cors: {
        origin: config.SOCKET_CORS_ORIGIN.split(','),
        methods: ['GET', 'POST'],
        credentials: true,
    },
});

// --- Настройка Redis Adapter для масштабирования ---
io.adapter(createAdapter(pubClient, subClient));

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
        pubClient.quit(() => console.log('✅ Redis PubClient disconnected.'));
        subClient.quit(() => console.log('✅ Redis SubClient disconnected.'));
        notificationSubscriber.quit(() =>
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
