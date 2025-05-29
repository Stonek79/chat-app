import { Server as SocketIOServer, Namespace } from 'socket.io';
import { jwtAuthMiddleware } from '../middlewares';
import { SocketWithUser } from '../socketHandler';
import {
    CHAT_NAMESPACE,
    SOCKET_EVENT_CONNECT,
    SOCKET_EVENT_DISCONNECT,
    CLIENT_EVENT_JOIN_CHAT,
    CLIENT_EVENT_LEAVE_CHAT,
    CLIENT_EVENT_SEND_MESSAGE,
    SERVER_EVENT_USER_JOINED,
    SERVER_EVENT_USER_LEFT,
    SERVER_EVENT_RECEIVE_MESSAGE,
} from '@/constants';

export const initChatNamespace = (io: SocketIOServer): void => {
    const chatNamespace: Namespace = io.of(CHAT_NAMESPACE);

    // Применяем middleware аутентификации JWT ко всем подключениям к этому неймспейсу
    chatNamespace.use(jwtAuthMiddleware);

    chatNamespace.on(SOCKET_EVENT_CONNECT, (socket: SocketWithUser) => {
        if (!socket.user) {
            // Это не должно произойти, если jwtAuthMiddleware отработало корректно
            console.error(
                'Ошибка: пользователь не аутентифицирован в chatNamespace после middleware.'
            );
            socket.disconnect(true);
            return;
        }

        console.log(
            `Пользователь ${socket.user.email} (ID: ${socket.user.id}) подключился к неймспейсу ${CHAT_NAMESPACE}`
        );

        // Пример обработчика события "joinChat"
        socket.on(CLIENT_EVENT_JOIN_CHAT, (chatId: string) => {
            if (!socket.user) return; // Дополнительная проверка
            console.log(
                `Пользователь ${socket.user.email} пытается присоединиться к чату ${chatId}`
            );
            // TODO: Проверить, имеет ли пользователь право присоединиться к этому чату (например, является ли он участником)
            socket.join(chatId);
            console.log(`Пользователь ${socket.user.email} присоединился к комнате ${chatId}`);

            // Оповестить других участников комнаты (опционально)
            socket.to(chatId).emit(SERVER_EVENT_USER_JOINED, {
                chatId,
                userId: socket.user.id,
                userEmail: socket.user.email,
            });
        });

        // Пример обработчика события "leaveChat"
        socket.on(CLIENT_EVENT_LEAVE_CHAT, (chatId: string) => {
            if (!socket.user) return;
            console.log(`Пользователь ${socket.user.email} покидает чат ${chatId}`);
            socket.leave(chatId);
            console.log(`Пользователь ${socket.user.email} покинул комнату ${chatId}`);

            // Оповестить других участников комнаты (опционально)
            socket.to(chatId).emit(SERVER_EVENT_USER_LEFT, {
                chatId,
                userId: socket.user.id,
                userEmail: socket.user.email,
            });
        });

        // Пример обработчика события "sendMessage"
        socket.on(CLIENT_EVENT_SEND_MESSAGE, (data: { chatId: string; content: string }) => {
            if (!socket.user) return;
            const { chatId, content } = data;
            console.log(
                `Пользователь ${socket.user.email} отправил сообщение в чат ${chatId}: ${content}`
            );

            // TODO: Сохранить сообщение в базе данных (Prisma)
            // const newMessage = await prisma.message.create({...});

            // Отправляем сообщение всем участникам комнаты, включая отправителя
            chatNamespace.to(chatId).emit(SERVER_EVENT_RECEIVE_MESSAGE, {
                chatId,
                senderId: socket.user.id,
                senderEmail: socket.user.email,
                content,
                timestamp: new Date(),
                // ...другие поля сообщения из БД
            });
        });

        socket.on(SOCKET_EVENT_DISCONNECT, (reason: string) => {
            if (!socket.user) {
                console.log(
                    `Неаутентифицированный сокет отключился от ${CHAT_NAMESPACE}, причина:`,
                    reason
                );
            } else {
                console.log(
                    `Пользователь ${socket.user.email} (ID: ${socket.user.id}) отключился от ${CHAT_NAMESPACE}, причина: ${reason}`
                );
                // TODO: Можно добавить логику для оповещения о выходе пользователя из всех комнат, в которых он был
            }
        });
    });

    console.log(`Неймспейс ${CHAT_NAMESPACE} инициализирован.`);
};
