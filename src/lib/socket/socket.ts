import { io } from 'socket.io-client';

import { CHAT_NAMESPACE } from '@/constants';
import type { AppSocket } from '@/types';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL;
const SOCKET_PATH = process.env.NEXT_PUBLIC_SOCKET_PATH || '/socket.io'; // Стандартный путь

if (!SOCKET_URL) {
    console.warn(
        'Socket.IO URL (NEXT_PUBLIC_SOCKET_URL) is not defined. Socket connections might fail.'
    );
}

let socketInstance: AppSocket | null = null;

/**
 * Получает или создает экземпляр Socket.IO клиента.
 * @param token - Опциональный JWT токен для аутентификации. Если не предоставлен, попытка аутентификации не будет произведена или будет использован предыдущий токен, если сокет уже существует.
 * @param forceNew - Если true, принудительно создаст новый экземпляр сокета, даже если старый существует.
 * @returns Типизированный экземпляр Socket.IO клиента или null, если URL не задан.
 */
export const getSocket = (token?: string | null, forceNew = false): AppSocket | null => {
    if (!SOCKET_URL) {
        console.error('Cannot initialize socket: NEXT_PUBLIC_SOCKET_URL is not set.');
        return null;
    }

    const socketNamespaceUrl = `${SOCKET_URL}${CHAT_NAMESPACE}`;

    if (forceNew && socketInstance) {
        console.log('[SocketIO] Forcing new connection, disconnecting existing instance.');
        socketInstance.disconnect();
        socketInstance = null;
    }

    if (!socketInstance) {
        console.log(`[SocketIO] Creating new socket instance for ${socketNamespaceUrl}`);
        socketInstance = io(socketNamespaceUrl, {
            path: SOCKET_PATH,
            reconnectionAttempts: 3,
            reconnectionDelay: 2000,
            timeout: 10000,
            // autoConnect: false, // Можно управлять подключением вручную через socket.connect()
            // transports: ['websocket', 'polling'], // Явно указать транспорты, если нужно
            auth: cb => {
                // Если токен предоставлен, передаем его для аутентификации
                // Серверное authMiddleware ожидает токен в cb({ token: '...' })
                // Однако, стандартный способ передачи токена - через cookies, которые браузер прикрепит автоматически,
                // если Socket.IO сервер и Next.js приложение на одном домене (или настроены credentials).
                // Если JWT передается не через HttpOnly cookie, а явно, то здесь его можно установить.
                // В нашем случае authMiddleware на сервере читает HttpOnly cookie, поэтому `auth` здесь может не понадобиться,
                // если cookie устанавливается корректно и доступен для socket.io запросов (проверить sameSite, domain, secure атрибуты cookie).
                // Оставляем возможность явной передачи токена, если потребуется для отладки или других сценариев.
                if (token) {
                    console.log('[SocketIO] Auth callback: providing token.');
                    cb({ token });
                } else {
                    console.log('[SocketIO] Auth callback: no token provided.');
                    cb({});
                }
            },
            withCredentials: true, // Важно, если используются HttpOnly cookies для аутентификации и сервер на другом поддомене/домене
        });

        // --- Стандартные обработчики событий для логирования и отладки ---
        socketInstance.on('connect', () => {
            console.log(
                `[SocketIO] Connected to ${socketNamespaceUrl}, socket ID: ${socketInstance?.id}`
            );
        });

        socketInstance.on('disconnect', reason => {
            console.log(`[SocketIO] Disconnected from ${socketNamespaceUrl}. Reason: ${reason}`);
            // Важно: при дисконнекте может потребоваться очистка socketInstance,
            // чтобы getSocket() создал новый при следующем вызове, если это желаемое поведение.
            // Но если есть логика реконнекта, то инстанс лучше сохранять.
            // socketInstance = null; // Раскомментировать, если нужно пересоздавать инстанс после каждого дисконнекта
        });

        socketInstance.on('connect_error', error => {
            console.error(`[SocketIO] Connection error to ${socketNamespaceUrl}:`, error.message);
            // error.data может содержать дополнительные сведения от сервера
            if (error && typeof error === 'object' && 'data' in error) {
                console.error('[SocketIO] Connection error data:', error.data);
            }
        });

        // Глобальный обработчик ошибок приложения от сервера
        // Событие 'error' из ServerToClientEvents
        socketInstance.on('error', errorData => {
            console.error('[SocketIO] Received app error from server:', errorData);
            // Здесь можно добавить логику для отображения уведомлений пользователю
        });
    }

    return socketInstance;
};

/**
 * Принудительно отключает и очищает текущий экземпляр сокета.
 */
export const disconnectSocket = () => {
    if (socketInstance) {
        console.log('[SocketIO] Disconnecting and clearing socket instance.');
        socketInstance.disconnect();
        socketInstance = null;
    }
};

/**
 * Подключает сокет, если он еще не подключен.
 * Создает инстанс, если его нет, используя предоставленный токен.
 */
export const connectSocket = (token?: string | null) => {
    const currentSocket = getSocket(token);
    if (currentSocket && !currentSocket.connected) {
        console.log('[SocketIO] Attempting to connect socket...');
        currentSocket.connect();
    }
    return currentSocket;
};

// Можно добавить обертки для emit/on, если хочется более декларативного API,
// но часто удобнее работать напрямую с экземпляром сокета в хуках или сервисах.

/**
 * Пример функции для отправки типизированного события.
 * @param eventName Имя события из ClientToServerEvents
 * @param payload Данные для события
 */
/*
export function emitSocketEvent<Event extends keyof ClientToServerEvents>(
    eventName: Event,
    ...args: Parameters<ClientToServerEvents[Event]>
) {
    const currentSocket = getSocket();
    if (currentSocket?.connected) {
        currentSocket.emit(eventName, ...args);
    } else {
        console.warn(`[SocketIO] Socket not connected. Cannot emit event '${String(eventName)}'.`);
    }
}
*/

console.log('[SocketIO] Socket manager (src/lib/socket.ts) initialized.');
