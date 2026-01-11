import { registerMessageHandlers } from './messageHandlers';
import { registerRoomHandlers } from './roomHandlers';
import { registerTypingHandlers } from './typingHandler';
import { type AppSocketServer, type AppSocket, SERVER_EVENT_USER_STATUS_CHANGED } from '@chat-app/socket-shared';
import { PresenceService } from '@chat-app/server-shared';

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
    
    // Обновляем статус присутствия в Redis
    // Не блокируем основной поток, но логируем ошибки
    PresenceService.setUserOnline(user.userId)
        .then(() => {
             // Broadcast online status to everyone else
             socket.broadcast.emit(SERVER_EVENT_USER_STATUS_CHANGED, {
                 userId: user.userId,
                 isOnline: true,
                 lastSeenAt: null // Currently online
             });
        })
        .catch((err: unknown) => 
            console.error(`[Connection] Failed to set online status for ${user.userId}:`, err)
        );

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

    // Регистрируем обработчики печати
    registerTypingHandlers(io, socket);

    // Обработчик отключения
    socket.on('disconnect', reason => {
        console.log(
            `[Connection] Пользователь ${user.username} (Socket: ${socket.id}) отключился. Причина: ${reason}`
        );
        
        // Обновляем статус присутствия (ставим offline и обновляем lastSeenAt в БД)
        PresenceService.setUserOffline(user.userId)
            .then(() => {
                // Broadcast offline status
                 socket.broadcast.emit(SERVER_EVENT_USER_STATUS_CHANGED, {
                     userId: user.userId,
                     isOnline: false,
                     lastSeenAt: new Date().toISOString()
                 });
            })
            .catch((err: unknown) => 
                console.error(`[Connection] Failed to set offline status for ${user.userId}:`, err)
            );
    });

    // Обработчик для кастомных ошибок от клиента
    socket.on('error', (error: Error) => {
        console.error(
            `[Connection] Socket error от клиента ${socket.id} (User: ${user.username}):`,
            error.message
        );
    });
};
