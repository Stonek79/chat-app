// Основной файл для выделенного Socket.IO сервера.
// Здесь будет инициализация HTTP сервера, Socket.IO, подключение адаптера Redis,
// настройка неймспейсов и обработчиков событий.

import { createServer } from 'http';
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import { jwtAuthMiddleware } from './middlewares/authMiddleware.ts';
import {
    CHAT_NAMESPACE,
    CLIENT_EVENT_JOIN_CHAT,
    CLIENT_EVENT_LEAVE_CHAT,
    CLIENT_EVENT_SEND_MESSAGE,
    SERVER_EVENT_RECEIVE_MESSAGE,
    SERVER_EVENT_USER_JOINED,
    SERVER_EVENT_USER_LEFT,
    SOCKET_EVENT_DISCONNECT,
    MessageContentTypeEnum,
    UserRoleEnum,
} from '#/constants';

import type {
    AppIoServer,
    AppServerSocket,
    ClientSendMessagePayload,
    SocketMessagePayload,
    SocketUserPresencePayload,
    GeneralSocketErrorPayload,
} from '#/types';

// --- Конфигурация (лучше вынести в переменные окружения) ---
const PORT = parseInt(process.env.SOCKET_PORT || '3001', 10);
const CORS_ORIGIN = process.env.SOCKET_CORS_ORIGIN || 'http://localhost:3000';
const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);
// const REDIS_PASSWORD = process.env.REDIS_PASSWORD;
const SOCKET_IO_NAMESPACE = CHAT_NAMESPACE;

// --- Инициализация HTTP и Socket.IO сервера ---
const httpServer = createServer();
// Используем типизированный AppIoServer
const io: AppIoServer = new Server(httpServer, {
    cors: {
        origin: CORS_ORIGIN.split(','), // Разрешаем несколько источников, если нужно
        methods: ['GET', 'POST'],
        credentials: true,
    },
    // Рассмотреть возможность указания пути, если Next.js и Socket.IO на одном домене, но разных путях
    // path: '/socket.io/'
});

console.log('REDIS_HOST', REDIS_HOST);
console.log('REDIS_PORT', REDIS_PORT);

// --- Настройка Redis Adapter для масштабирования ---
// Предполагаем использование одиночного экземпляра Redis. Для кластера или Sentinel конфигурация будет сложнее.
const pubClient = new Redis({
    host: REDIS_HOST,
    port: REDIS_PORT,
    // password: REDIS_PASSWORD, // Раскомментировать, если Redis требует пароль
    // tls: REDIS_HOST !== 'localhost' ? {} : undefined, // Пример для включения TLS, если Redis не локальный
});
const subClient = pubClient.duplicate();

io.adapter(createAdapter(pubClient, subClient));

pubClient.on('error', (err: Error) => {
    console.error('Redis PubClient Error:', err);
});
subClient.on('error', (err: Error) => {
    console.error('Redis SubClient Error:', err);
});

// --- Неймспейс /chat ---
const chatNamespace = io.of(SOCKET_IO_NAMESPACE);

// Подключаем middleware аутентификации
chatNamespace.use(jwtAuthMiddleware);

chatNamespace.on('connection', (socket: AppServerSocket) => {
    // Используем AppServerSocket
    const authenticatedUser = socket.data.user;

    if (authenticatedUser) {
        console.log(
            `[Socket.IO Server ${SOCKET_IO_NAMESPACE}] Authenticated user ${authenticatedUser.username} (Email: ${authenticatedUser.email || 'N/A'}) connected: ${socket.id}`
        );
    } else {
        console.warn(
            `[Socket.IO Server ${SOCKET_IO_NAMESPACE}] User connected WITHOUT authentication: ${socket.id}. This should be handled by auth middleware.`
        );
        // jwtAuthMiddleware должен вызывать next(new Error(...)) и не допускать сюда неаутентифицированных пользователей,
        // если он настроен на обязательную аутентификацию.
        // Если же анонимный доступ разрешен, эта ветка легитимна.
        // Сейчас authMiddleware разрывает соединение, так что эта ветка не должна достигаться.
    }
    // console.log('Socket handshake query:', socket.handshake.query);
    // console.log('Socket handshake auth:', socket.handshake.auth); // Для токенов

    socket.on(SOCKET_EVENT_DISCONNECT, (reason: string) => {
        const user = socket.data.user;
        if (user) {
            console.log(
                `[Socket.IO Server ${SOCKET_IO_NAMESPACE}] User ${user.username} (Socket: ${socket.id}) disconnected. Reason: ${reason}`
            );
        } else {
            console.log(
                `[Socket.IO Server ${SOCKET_IO_NAMESPACE}] Anonymous user (Socket: ${socket.id}) disconnected. Reason: ${reason}`
            );
        }
        // TODO: Возможно, здесь нужно оповестить комнаты, что пользователь отключился, если он был в них.
        // Это зависит от логики вашего приложения (например, если leaveRoom не всегда вызывается перед disconnect).
    });

    socket.on(
        CLIENT_EVENT_SEND_MESSAGE,
        (
            payload: ClientSendMessagePayload,
            // Добавляем ack колбэк, который будет вызван для ответа клиенту
            ack?: (response: { success: boolean; messageId?: string; error?: string }) => void
        ) => {
            const user = socket.data.user;
            if (!user) {
                // Если есть ack, отвечаем ошибкой аутентификации
                ack?.({ success: false, error: 'Authentication required' });
                // Отправляем также общую ошибку по сокету, если это старое поведение
                const errorPayload: GeneralSocketErrorPayload = {
                    message: 'Authentication required to send messages.',
                    code: 'UNAUTHORIZED',
                };
                socket.emit('error', errorPayload); // Используем стандартное событие 'error' для ошибок приложения
                console.warn(
                    `[Socket.IO Server ${SOCKET_IO_NAMESPACE}] Unauthorized user ${socket.id} attempted to send message.`
                );
                return;
            }

            console.log(
                `[Socket.IO Server ${SOCKET_IO_NAMESPACE}] Message from ${user.username} (Socket: ${socket.id}) in room ${payload.chatId}: ${payload.content}`
            );

            const messageData: SocketMessagePayload = {
                chatId: payload.chatId,
                sender: {
                    id: user.userId,
                    email: user.email || '',
                    role: user.role || UserRoleEnum.USER,
                    username: user.username || '',
                    avatarUrl: user.avatarUrl || '',
                },
                createdAt: new Date(),
                content: payload.content,
                contentType: payload.contentType || MessageContentTypeEnum.TEXT,
                mediaUrl: payload.mediaUrl,
                readReceipts: [],
            };

            // Отправляем сообщение в указанную комнату (chatId)
            chatNamespace.to(payload.chatId).emit(SERVER_EVENT_RECEIVE_MESSAGE, messageData);

            // Отвечаем клиенту через ack, что сообщение принято (но еще не обязательно сохранено в БД)
            // В будущем, messageId можно будет получить после сохранения в БД и передать сюда.
            ack?.({ success: true, messageId: messageData.id || `temp-${Date.now()}` });
        }
    );

    socket.on(CLIENT_EVENT_JOIN_CHAT, (chatId: string) => {
        const user = socket.data.user;
        if (!user) {
            socket.emit('error', {
                message: 'Authentication required to join chat.',
                code: 'UNAUTHORIZED',
            } as GeneralSocketErrorPayload);
            return;
        }
        socket.join(chatId);
        console.log(
            `[Socket.IO Server ${SOCKET_IO_NAMESPACE}] User ${user.userId} (Socket: ${socket.id}) joined room: ${chatId}`
        );

        const presencePayload: SocketUserPresencePayload = {
            chatId,
            userId: user.userId,
            email: user.email!,
            role: user.role!,
            username: user.username!,
        };
        socket.to(chatId).emit(SERVER_EVENT_USER_JOINED, presencePayload);
        // Можно отправить подтверждение клиенту:
        // socket.emit('joinedRoomSuccess', { chatId }); // Если нужно явное подтверждение
    });

    socket.on(CLIENT_EVENT_LEAVE_CHAT, (chatId: string) => {
        const user = socket.data.user;
        if (!user) {
            // Ошибку можно не отправлять, т.к. выход из комнаты неаутентифицированным не критичен
            // но залогировать стоит.
            console.warn(
                `[Socket.IO Server ${SOCKET_IO_NAMESPACE}] Anonymous user ${socket.id} attempted to leave room ${chatId}`
            );
            return;
        }

        socket.leave(chatId);
        console.log(
            `[Socket.IO Server ${SOCKET_IO_NAMESPACE}] User ${user.userId} (Socket: ${socket.id}) left room: ${chatId}`
        );

        const presencePayload: SocketUserPresencePayload = {
            chatId,
            userId: user.userId,
            email: user.email!,
            role: user.role!,
            username: user.username!,
        };
        socket.to(chatId).emit(SERVER_EVENT_USER_LEFT, presencePayload);
    });

    // Обработчик для кастомных ошибок от клиента, если такие будут
    socket.on('error', (error: Error) => {
        console.error(
            `[Socket.IO Server ${SOCKET_IO_NAMESPACE}] Socket error from client ${socket.id} (User: ${socket.data.user?.username || 'Anonymous'}):`,
            error.message,
            error.stack
        );
    });
});

// --- Запуск сервера ---
httpServer.listen(PORT, () => {
    console.log(`Socket.IO server is running on port ${PORT}`);
    console.log(`Allowed CORS origins: ${CORS_ORIGIN}`);
    console.log(`Listening on namespace: ${SOCKET_IO_NAMESPACE}`);
});

// Обработка сигналов для корректного завершения
const signals = ['SIGINT', 'SIGTERM', 'SIGQUIT'] as const;
signals.forEach(signal => {
    process.on(signal, () => {
        console.log(`\nReceived ${signal}, shutting down gracefully...`);
        io.close(() => {
            console.log('Socket.IO server closed.');
            pubClient.quit(() => console.log('Redis PubClient disconnected.'));
            subClient.quit(() => console.log('Redis SubClient disconnected.'));
            httpServer.close(() => {
                console.log('HTTP server closed.');
                process.exit(0);
            });
        });
    });
});

export { io, httpServer }; // Экспорт для возможного использования в тестах
