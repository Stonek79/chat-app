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
    SERVER_EVENT_CHAT_CREATED,
    CLIENT_EVENT_MARK_AS_READ,
    SERVER_EVENT_MESSAGES_READ,
    SERVER_EVENT_MESSAGE_DELETED,
} from '#/constants';

import type {
    AppIoServer,
    AppServerSocket,
    ClientSendMessagePayload,
    SocketMessagePayload,
    SocketUserPresencePayload,
    GeneralSocketErrorPayload,
} from '#/types';
import { sendMessageSocketSchema } from '#/schemas';

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
            } else if (notificationPayload.type === 'MESSAGE_DELETED' && notificationPayload.data) {
                const { chatId, messageId, action } = notificationPayload.data;
                if (chatId && messageId && action) {
                    console.log(
                        `[Socket.IO Server] Processing MESSAGE_DELETED event for message ID: ${messageId} in chat ID: ${chatId}.`
                    );
                    io.of(SOCKET_IO_NAMESPACE)
                        .to(chatId)
                        .emit(SERVER_EVENT_MESSAGE_DELETED, { chatId, messageId, action });
                    console.log(
                        `[Socket.IO Server] Emitted SERVER_EVENT_MESSAGE_DELETED to room ${chatId} for message ${messageId}`
                    );
                } else {
                    console.warn(
                        '[Socket.IO Server] Invalid data in MESSAGE_DELETED event:',
                        notificationPayload.data
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
        async (
            payload: ClientSendMessagePayload,
            ack?: (response: {
                success: boolean;
                messageId?: string;
                createdAt?: Date;
                error?: string;
            }) => void
        ) => {
            try {
                const user = socket.data.user;
                if (!user) {
                    throw new Error('Для отправки сообщений требуется аутентификация.');
                }

                // 1. Валидация payload с помощью Zod
                const validationResult = sendMessageSocketSchema.safeParse(payload);
                if (!validationResult.success) {
                    throw new Error(
                        `Ошибка валидации: ${validationResult.error.flatten().fieldErrors}`
                    );
                }
                const {
                    chatId,
                    content,
                    contentType = 'TEXT',
                    clientTempId,
                } = validationResult.data;

                console.log(
                    `[Socket.IO Server] User ${user.username} is attempting to send a message to chat ${chatId}.`
                );

                // 2. Проверяем, является ли пользователь участником чата
                const participant = await prisma.chatParticipant.findFirst({
                    where: { userId: user.userId, chatId: chatId },
                });

                if (!participant) {
                    throw new Error('Вы не являетесь участником этого чата.');
                }

                // 3. Создаем сообщение и обновляем чат в одной транзакции
                const [newMessage] = await prisma.$transaction([
                    prisma.message.create({
                        data: {
                            content,
                            contentType: contentType as PrismaMessageContentType,
                            chatId,
                            senderId: user.userId,
                        },
                        include: {
                            sender: {
                                select: {
                                    id: true,
                                    username: true,
                                    email: true,
                                    avatarUrl: true,
                                    role: true,
                                },
                            },
                        },
                    }),
                    prisma.chat.update({
                        where: { id: chatId },
                        data: { updatedAt: new Date() },
                    }),
                ]);

                if (!newMessage) {
                    throw new Error('Не удалось создать сообщение.');
                }

                // 4. Создаем полезную нагрузку для отправки клиентам
                const messagePayload: SocketMessagePayload = {
                    id: newMessage.id,
                    chatId: newMessage.chatId,
                    content: newMessage.content,
                    contentType: newMessage.contentType,
                    createdAt: newMessage.createdAt,
                    updatedAt: newMessage.updatedAt,
                    sender: {
                        id: newMessage.sender.id,
                        username: newMessage.sender.username,
                        avatarUrl: newMessage.sender.avatarUrl,
                        role: newMessage.sender.role,
                        email: newMessage.sender.email,
                    },
                    readReceipts: [],
                    actions: [],
                    clientTempId, // Включаем временный ID для UI
                };

                // 5. Отправляем сообщение всем в комнате чата
                chatNamespace.to(chatId).emit(SERVER_EVENT_RECEIVE_MESSAGE, messagePayload);
                console.log(`[Socket.IO Server] Message ${newMessage.id} sent to room ${chatId}.`);

                // 6. Отправляем подтверждение отправителю
                ack?.({
                    success: true,
                    messageId: newMessage.id,
                    createdAt: newMessage.createdAt,
                });
            } catch (error) {
                const errorMessage =
                    error instanceof Error
                        ? error.message
                        : 'Произошла неизвестная ошибка при отправке сообщения.';
                console.error(`[Socket.IO Server] Error sending message:`, error);
                ack?.({ success: false, error: errorMessage });
            }
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
                return;
            }

            const { chatId, lastReadMessageId } = payload;
            const currentReadTime = new Date();

            try {
                // 1. Найти все потенциальные сообщения для отметки
                const potentialMessages = await prisma.message.findMany({
                    where: {
                        chatId: chatId,
                        id: { lte: lastReadMessageId },
                        senderId: { not: user.userId },
                    },
                    select: { id: true },
                });

                if (potentialMessages.length === 0) {
                    return; // Нет сообщений от других пользователей в этом диапазоне
                }

                const potentialMessageIds = potentialMessages.map(m => m.id);

                // 2. Найти сообщения из этого списка, которые уже прочитаны пользователем
                const alreadyReadReceipts = await prisma.messageReadReceipt.findMany({
                    where: {
                        userId: user.userId,
                        messageId: { in: potentialMessageIds },
                    },
                    select: { messageId: true },
                });

                const alreadyReadMessageIds = new Set(alreadyReadReceipts.map(r => r.messageId));

                // 3. Определить сообщения, которые действительно нужно пометить как прочитанные
                const messageIdsToMarkAsRead = potentialMessageIds.filter(
                    id => !alreadyReadMessageIds.has(id)
                );

                if (messageIdsToMarkAsRead.length === 0) {
                    console.log(
                        `[Socket.IO Server ${SOCKET_IO_NAMESPACE}] No new messages to mark as read for user ${user.userId} in chat ${chatId} up to message ${lastReadMessageId}.`
                    );
                    return;
                }

                const readReceiptsData = messageIdsToMarkAsRead.map(messageId => ({
                    messageId: messageId,
                    userId: user.userId,
                    readAt: currentReadTime,
                }));

                // 4. Создать записи MessageReadReceipt
                await prisma.messageReadReceipt.createMany({
                    data: readReceiptsData,
                    skipDuplicates: true,
                });

                console.log(
                    `[Socket.IO Server ${SOCKET_IO_NAMESPACE}] User ${user.userId} marked ${readReceiptsData.length} messages as read in chat ${chatId} up to ${lastReadMessageId}.`
                );

                // 5. Оповестить клиентов в комнате о том, что сообщения прочитаны
                chatNamespace.to(chatId).emit(SERVER_EVENT_MESSAGES_READ, {
                    chatId: chatId,
                    userId: user.userId,
                    lastReadMessageId: lastReadMessageId,
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

    socket.on(CLIENT_EVENT_JOIN_CHAT, async (chatId: string) => {
        const user = socket.data.user;
        if (!user) {
            socket.emit('error', {
                message: 'Authentication required to join chat.',
                code: 'UNAUTHORIZED',
            } as GeneralSocketErrorPayload);
            return;
        }

        try {
            const participant = await prisma.chatParticipant.findFirst({
                where: {
                    userId: user.userId,
                    chatId: chatId,
                },
            });

            if (!participant) {
                console.warn(
                    `[Socket.IO] User ${user.userId} failed to join chat ${chatId}: not a participant.`
                );
                socket.emit('error', {
                    message: 'You are not a member of this chat.',
                    code: 'FORBIDDEN',
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
                role: participant.role,
                username: user.username!,
                avatarUrl: user.avatarUrl || '',
            };
            socket.to(chatId).emit(SERVER_EVENT_USER_JOINED, presencePayload);
        } catch (error) {
            console.error(
                `[Socket.IO] Error during JOIN_CHAT for user ${user.userId} in chat ${chatId}:`,
                error
            );
            socket.emit('error', {
                message: 'An internal error occurred.',
                code: 'INTERNAL_ERROR',
            } as GeneralSocketErrorPayload);
        }
    });

    socket.on(CLIENT_EVENT_LEAVE_CHAT, async (chatId: string) => {
        const user = socket.data.user;
        if (!user) {
            console.warn(
                `[Socket.IO] Anonymous user ${socket.id} attempted to leave room ${chatId}`
            );
            return;
        }

        try {
            const participant = await prisma.chatParticipant.findFirst({
                where: {
                    userId: user.userId,
                    chatId: chatId,
                },
                select: { role: true },
            });

            socket.leave(chatId);
            console.log(
                `[Socket.IO Server ${SOCKET_IO_NAMESPACE}] User ${user.userId} (Socket: ${socket.id}) left room: ${chatId}`
            );

            if (participant) {
                const presencePayload: SocketUserPresencePayload = {
                    chatId,
                    userId: user.userId,
                    email: user.email!,
                    role: participant.role,
                    username: user.username!,
                    avatarUrl: user.avatarUrl || '',
                };
                socket.to(chatId).emit(SERVER_EVENT_USER_LEFT, presencePayload);
            }
        } catch (error) {
            console.error(
                `[Socket.IO] Error during LEAVE_CHAT for user ${user.userId} in chat ${chatId}:`,
                error
            );
        }
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
