import { registerMessageHandlers } from './messageHandlers';
import { registerRoomHandlers } from './roomHandlers';
import type { AppSocketServer, AppSocket } from '@chat-app/socket-shared';

/**
 * Главный обработчик события подключения к сокету.
 * Здесь регистрируются все обработчики событий для данного сокета.
 * @param io - Экземпляр сервера Socket.IO.
 * @param socket - Подключенный сокет клиента.
 */
export const onConnection = (io: AppSocketServer, socket: AppSocket) => {
    const { user } = socket.data;

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

    // Регистрируем обработчики сообщений
    registerMessageHandlers(io, socket);

    // Регистрируем обработчики комнат
    registerRoomHandlers(socket);

    // Обработчик отключения
    socket.on('disconnect', reason => {
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
