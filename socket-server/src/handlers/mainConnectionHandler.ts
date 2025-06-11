import { SOCKET_EVENT_DISCONNECT } from '#/constants';
import type { AppIoServer, AppServerSocket } from '#/types';

import { registerMessageHandlers, registerRoomHandlers } from './';

/**
 * Обрабатывает первоначальное подключение пользователя и настраивает все обработчики событий.
 * @param io - Экземпляр сервера Socket.IO.
 * @param socket - Экземпляр сокета для подключенного клиента.
 */
export const onConnection = (io: AppIoServer, socket: AppServerSocket) => {
    const user = socket.data.user;

    if (!user) {
        // Этого не должно произойти, если authMiddleware отрабатывает корректно
        console.warn(
            `[Connection] Пользователь подключился без аутентификации: ${socket.id}. Соединение будет разорвано.`
        );
        socket.disconnect(true);
        return;
    }

    // Присоединяем пользователя к его персональной комнате для получения личных уведомлений
    socket.join(user.userId);
    console.log(
        `[Connection] Пользователь ${user.username} (ID: ${user.userId}) аутентифицирован и подключен. Socket ID: ${socket.id}.`
    );
    console.log(
        `[Connection] Пользователь ${user.username} присоединился к личной комнате: ${user.userId}`
    );

    // Регистрируем обработчики для комнат (присоединение/выход из чатов)
    registerRoomHandlers(socket);

    // Регистрируем обработчики для сообщений (отправка/прочтение)
    registerMessageHandlers(io, socket);

    // Обработчик отключения
    socket.on(SOCKET_EVENT_DISCONNECT, (reason: string) => {
        console.log(
            `[Connection] Пользователь ${user.username} (Socket: ${socket.id}) отключился. Причина: ${reason}`
        );
        // Здесь можно добавить логику для уведомления других пользователей о том, что юзер вышел из сети,
        // если это необходимо для вашего приложения.
    });

    // Обработчик для кастомных ошибок от клиента
    socket.on('error', (error: Error) => {
        console.error(
            `[Connection] Socket error от клиента ${socket.id} (User: ${user.username}):`,
            error.message
        );
    });
};
