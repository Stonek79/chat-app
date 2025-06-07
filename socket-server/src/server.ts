// Основной файл для выделенного Socket.IO сервера.
// Здесь будет инициализация HTTP сервера, Socket.IO, подключение адаптера Redis,
// настройка неймспейсов и обработчиков событий.

import { createServer } from 'http';
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import { jwtAuthMiddleware } from './middlewares/authMiddleware.ts';
import { PrismaClient, MessageContentType as PrismaMessageContentType } from '@prisma/client';
import {
    CHAT_NAMESPACE,
    CLIENT_EVENT_JOIN_CHAT,
    CLIENT_EVENT_LEAVE_CHAT,
    CLIENT_EVENT_SEND_MESSAGE,
    SERVER_EVENT_RECEIVE_MESSAGE,
    SERVER_EVENT_USER_JOINED,
    SERVER_EVENT_USER_LEFT,
    SOCKET_EVENT_DISCONNECT,
    UserRoleEnum,
    SERVER_EVENT_CHAT_CREATED,
    CLIENT_EVENT_MARK_AS_READ,
    SERVER_EVENT_MESSAGES_READ,
} from '#/constants';

import type {
    AppIoServer,
    AppServerSocket,
    ClientSendMessagePayload,
    SocketMessagePayload,
    SocketUserPresencePayload,
    GeneralSocketErrorPayload,
    MessageContentType,
} from '#/types';

// --- Инициализация Prisma Client ---
const prisma = new PrismaClient();

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

// --- Клиент Redis для подписки на уведомления от API ---
const notificationSubscriber = pubClient.duplicate(); // Используем существующий pubClient для создания подписчика
const redisNotificationsChannel =
    process.env.REDIS_SOCKET_NOTIFICATIONS_CHANNEL || 'socket-notifications';

notificationSubscriber.on('connect', () => {
    console.log(
        `[Socket.IO Server] NotificationSubClient connected to Redis. Subscribing to ${redisNotificationsChannel}...`
    );
    notificationSubscriber.subscribe(redisNotificationsChannel, (err, count) => {
        if (err) {
            console.error(
                `[Socket.IO Server] Failed to subscribe to Redis channel ${redisNotificationsChannel}:`,
                err
            );
            return;
        }
        console.log(
            `[Socket.IO Server] Subscribed to Redis channel: ${redisNotificationsChannel}. Number of subscribed channels: ${count}`
        );
    });
});

notificationSubscriber.on('error', (err: Error) => {
    console.error('[Socket.IO Server] Redis NotificationSubClient Error:', err);
});

notificationSubscriber.on('message', (channel, message) => {
    if (channel === redisNotificationsChannel) {
        console.log(`[Socket.IO Server] Received message from Redis channel ${channel}`);
        try {
            const notificationPayload = JSON.parse(message);

            if (notificationPayload.type === 'NEW_CHAT' && notificationPayload.data) {
                const { chatData, initiatorUserId } = notificationPayload.data; // chatData это ClientChat
                if (
                    chatData &&
                    chatData.id &&
                    chatData.members &&
                    Array.isArray(chatData.members)
                ) {
                    console.log(
                        `[Socket.IO Server] Processing NEW_CHAT event for chat ID: ${chatData.id}. Initiator: ${initiatorUserId}. Members: ${chatData.members.length}`
                    );

                    chatData.members.forEach((member: { id: string; username?: string }) => {
                        // Упрощенный тип для member, ожидаем ClientChatParticipant
                        if (member && member.id) {
                            // member.id это userId
                            // Отправляем событие SERVER_EVENT_CHAT_CREATED в личную комнату каждого участника
                            // Клиент получит полный объект chatData (типа ClientChat)
                            // Убедимся, что chatNamespace существует и доступен здесь
                            io.of(SOCKET_IO_NAMESPACE)
                                .to(member.id)
                                .emit(SERVER_EVENT_CHAT_CREATED, chatData);
                            console.log(
                                `[Socket.IO Server] Emitted SERVER_EVENT_CHAT_CREATED to user ${member.id} (room ${member.id}) for new chat ${chatData.id}`
                            );
                        } else {
                            console.warn(
                                '[Socket.IO Server] Invalid member data in NEW_CHAT event:',
                                member
                            );
                        }
                    });
                } else {
                    console.warn(
                        '[Socket.IO Server] Invalid chatData in NEW_CHAT event:',
                        chatData
                    );
                }
            } else {
                console.warn(
                    `[Socket.IO Server] Received unknown payload type from Redis: ${notificationPayload.type || 'N/A'} on channel ${channel}`
                );
            }
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : String(e);
            console.error(
                `[Socket.IO Server] Error parsing or processing message from Redis channel ${channel}: ${errorMessage}. Raw message: "${message}"`
            );
        }
    }
});

// --- Неймспейс /chat ---
const chatNamespace = io.of(SOCKET_IO_NAMESPACE);

// Подключаем middleware аутентификации
chatNamespace.use(jwtAuthMiddleware);

chatNamespace.on('connection', (socket: AppServerSocket) => {
    // Используем AppServerSocket
    const authenticatedUser = socket.data.user;

    if (authenticatedUser) {
        socket.join(authenticatedUser.userId); // Пользователь присоединяется к комнате по своему userId
        console.log(
            `[Socket.IO Server ${SOCKET_IO_NAMESPACE}] User ${authenticatedUser.username} (ID: ${authenticatedUser.userId}) joined their personal room ${authenticatedUser.userId}`
        );
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
            // Обновляем тип ack
            ack?: (response: {
                success: boolean;
                messageId?: string;
                createdAt?: Date; // Добавляем createdAt в ack
                error?: string;
            }) => void
        ) => {
            const user = socket.data.user;
            if (!user) {
                ack?.({ success: false, error: 'Authentication required' });
                const errorPayload: GeneralSocketErrorPayload = {
                    message: 'Authentication required to send messages.',
                    code: 'UNAUTHORIZED',
                };
                socket.emit('error', errorPayload);
                console.warn(
                    `[Socket.IO Server ${SOCKET_IO_NAMESPACE}] Unauthorized user ${socket.id} attempted to send message.`
                );
                return;
            }

            console.log(
                `[Socket.IO Server ${SOCKET_IO_NAMESPACE}] Attempting to save message from ${user.username} (Socket: ${socket.id}) in chat ${payload.chatId}: ${payload.content}`
            );

            // Сохранение сообщения в БД
            prisma.message
                .create({
                    data: {
                        chatId: payload.chatId,
                        senderId: user.userId, // senderId из аутентифицированного пользователя
                        content: payload.content,
                        contentType: payload.contentType || PrismaMessageContentType.TEXT,
                        mediaUrl: payload.mediaUrl,
                        // readReceipts и другие поля будут по умолчанию или установлены позже
                    },
                    include: {
                        sender: true,
                        readReceipts: true,
                    },
                })
                .then(savedMessage => {
                    console.log(
                        `[Socket.IO Server ${SOCKET_IO_NAMESPACE}] Message saved to DB with ID: ${savedMessage.id}`
                    );

                    const messageData: SocketMessagePayload = {
                        id: savedMessage.id, // ID из БД
                        chatId: savedMessage.chatId,
                        sender: {
                            // Формируем BasicUser из socket.data.user
                            id: user.userId,
                            username: user.username || '',
                            email: user.email || '',
                            role: user.role || UserRoleEnum.USER, // Используем UserRoleEnum или Prisma enum
                            avatarUrl: user.avatarUrl || '',
                        },
                        content: savedMessage.content,
                        contentType: savedMessage.contentType as MessageContentType, // Приведение типа к MessageContentType
                        mediaUrl: savedMessage.mediaUrl,
                        createdAt: savedMessage.createdAt, // createdAt из БД
                        updatedAt: savedMessage.updatedAt, // updatedAt из БД
                        readReceipts: [], // Начальное значение, будет обновляться
                        deletedAt: savedMessage.deletedAt, // deletedAt из БД (должно быть null)
                    };

                    // Отправляем сообщение в указанную комнату (chatId)
                    chatNamespace
                        .to(payload.chatId)
                        .emit(SERVER_EVENT_RECEIVE_MESSAGE, messageData);
                    console.log(
                        `[Socket.IO Server ${SOCKET_IO_NAMESPACE}] Emitted SERVER_EVENT_RECEIVE_MESSAGE to room ${payload.chatId} for message ${savedMessage.id}`
                    );

                    // Отправляем подтверждение клиенту
                    ack?.({
                        success: true,
                        messageId: savedMessage.id,
                        createdAt: savedMessage.createdAt,
                    });
                })
                .catch(error => {
                    console.error(
                        `[Socket.IO Server ${SOCKET_IO_NAMESPACE}] Error saving message to DB for chat ${payload.chatId}:`,
                        error
                    );
                    ack?.({ success: false, error: 'Failed to save message to database.' });
                });
        }
    );

    socket.on(
        CLIENT_EVENT_MARK_AS_READ,
        async (payload: { chatId: string; lastReadMessageId: string }) => {
            const user = socket.data.user;
            if (!user || !user.userId) {
                console.warn(
                    `[Socket.IO Server ${SOCKET_IO_NAMESPACE}] Unauthorized attempt to mark messages as read.`
                );
                // Можно отправить ошибку клиенту, если это необходимо
                // socket.emit('error', { message: 'Authentication required.', code: 'UNAUTHORIZED' });
                return;
            }

            const { chatId, lastReadMessageId } = payload;
            const currentReadTime = new Date();

            try {
                // 1. Найти все сообщения в чате, которые:
                //    - Не были отправлены текущим пользователем (user.userId)
                //    - Были созданы до или в то же время, что и lastReadMessageId (предполагая, что ID сортируемы по времени или это ID конкретного сообщения)
                //    - Для которых еще нет записи MessageReadReceipt от этого пользователя

                // Сначала найдем ID всех сообщений, которые должен прочитать пользователь
                const messagesToMarkAsRead = await prisma.message.findMany({
                    where: {
                        chatId: chatId,
                        id: { lte: lastReadMessageId }, // Сообщения до lastReadMessageId включительно
                        senderId: { not: user.userId }, // Не свои сообщения
                        readReceipts: {
                            // И для которых нет записи о прочтении этим пользователем
                            none: {
                                userId: user.userId,
                            },
                        },
                    },
                    select: {
                        id: true, // Нам нужны только ID для создания записей о прочтении
                    },
                });

                if (messagesToMarkAsRead.length === 0) {
                    console.log(
                        `[Socket.IO Server ${SOCKET_IO_NAMESPACE}] No new messages to mark as read for user ${user.userId} in chat ${chatId} up to message ${lastReadMessageId}.`
                    );
                    return; // Нет сообщений для отметки
                }

                const readReceiptsData = messagesToMarkAsRead.map(message => ({
                    messageId: message.id,
                    userId: user.userId,
                    readAt: currentReadTime,
                }));

                // 2. Создать записи MessageReadReceipt для этих сообщений
                const mr = await prisma.messageReadReceipt.createMany({
                    data: readReceiptsData,
                    skipDuplicates: true, // Важно, чтобы не было ошибок при повторной попытке (хотя where выше должен это предотвращать)
                });

                console.log('MESSAGE_READ_RECEIPT', mr);

                console.log(
                    `[Socket.IO Server ${SOCKET_IO_NAMESPACE}] User ${user.userId} marked ${readReceiptsData.length} messages as read in chat ${chatId} up to ${lastReadMessageId}.`
                );

                // 3. Оповестить клиентов в комнате о том, что сообщения прочитаны
                // Отправляем всем в комнате, включая самого пользователя, который прочитал.
                // Это позволит UI обновить статусы сообщений.
                chatNamespace.to(chatId).emit(SERVER_EVENT_MESSAGES_READ, {
                    chatId: chatId,
                    userId: user.userId,
                    lastReadMessageId: lastReadMessageId, // Отправляем ID последнего сообщения, до которого были прочитаны
                    readAt: currentReadTime,
                });
            } catch (error) {
                console.error(
                    `[Socket.IO Server ${SOCKET_IO_NAMESPACE}] Error marking messages as read for user ${user.userId} in chat ${chatId}:`,
                    error
                );
                // Опционально: отправить ошибку клиенту
                // socket.emit('error', { message: 'Failed to mark messages as read.', code: 'INTERNAL_ERROR' });
            }
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
            notificationSubscriber.quit(() =>
                console.log('[Socket.IO Server] Redis NotificationSubClient disconnected.')
            );
            httpServer.close(() => {
                console.log('HTTP server closed.');
                process.exit(0);
            });
        });
    });
});

export { io, httpServer }; // Экспорт для возможного использования в тестах
