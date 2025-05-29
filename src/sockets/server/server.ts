// src/sockets/server.ts
import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
// import { Redis } from 'ioredis'; // или другой клиент Redis
// import { createAdapter } from '@socket.io/redis-adapter';
// import { prisma } from '@/lib/prisma'; // Ваш Prisma client
// import { decryptData, stringToArrayBuffer, arrayBufferToString } from '@/lib/crypto'; // Ваши крипто-утилиты
// import { getChatEncryptionKey } from '@/store/chatStore'; // Пример получения ключа, возможно, понадобится другой способ на сервере

/**
 * Модуль для инициализации и настройки сервера Socket.IO.
 * Обрабатывает подключения клиентов, получение и отправку сообщений, интеграцию с Redis Pub/Sub.
 */

interface AuthenticatedSocket extends Socket {
  userId?: string; // Добавляем userId к типу Socket после аутентификации
  chatId?: string; // Текущий чат, к которому подключен сокет
}

let io: SocketIOServer;

/**
 * Инициализирует сервер Socket.IO и подключает его к HTTP серверу Next.js.
 * @param {HttpServer} httpServer - HTTP сервер.
 */
export function initSocketIOServer(httpServer: HttpServer): SocketIOServer {
  if (io) {
    console.log('Socket.IO сервер уже инициализирован.');
    return io;
  }

  io = new SocketIOServer(httpServer, {
    path: '/api/socketio', // Путь, по которому клиенты будут подключаться
    cors: {
      origin: process.env.CORS_ORIGIN || "http://localhost:3000", // Укажите разрешенные origin
      methods: ["GET", "POST"],
    },
    // transports: ['websocket', 'polling'], // Можно ограничить транспорты
  });

  console.log('Socket.IO сервер инициализирован и слушает на /api/socketio');

  // // --- Интеграция с Redis Adapter для масштабирования (раскомментируйте и настройте) ---
  // const pubClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  // const subClient = pubClient.duplicate();
  // io.adapter(createAdapter(pubClient, subClient));
  // console.log('Socket.IO Redis Adapter подключен.');
  // // ----------------------------------------------------------------------------------

  // Middleware для аутентификации сокета (пример)
  io.use(async (socket: AuthenticatedSocket, next) => {
    // TODO: Реализуйте вашу логику аутентификации сокета
    // Например, проверка JWT токена, переданного в handshake query или headers
    const token = socket.handshake.auth.token || socket.handshake.query.token;
    const chatId = socket.handshake.query.chatId as string;

    if (token && chatId) {
      // const decoded = verifyToken(token); // Ваша функция верификации токена
      // socket.userId = decoded.userId;
      socket.userId = `user_${Math.random().toString(36).substring(7)}`; // Заглушка userId
      socket.chatId = chatId;
      console.log(`Socket authenticated: userId=${socket.userId}, chatId=${socket.chatId}`);
      return next();
    } else {
      console.error('Socket authentication failed: No token or chatId provided');
      return next(new Error('Authentication error: Missing token or chatId'));
    }
  });

  const chatNamespace = io.of('/chat'); // Создаем или используем namespace /chat

  chatNamespace.on('connection', (socket: AuthenticatedSocket) => {
    if (!socket.userId || !socket.chatId) {
      console.error('Socket подключился без userId или chatId после middleware. Отключаем.');
      socket.disconnect(true);
      return;
    }

    console.log(`Клиент ${socket.id} (userId: ${socket.userId}) подключился к чату ${socket.chatId}`);
    socket.join(socket.chatId); // Присоединяем сокет к комнате по chatId

    socket.on('send_message', async (data: { encryptedData: string; iv: string /* ...другие поля, если нужны */ }) => {
      if (!socket.userId || !socket.chatId) return;

      console.log(`Получено сообщение от ${socket.userId} в чат ${socket.chatId}:`, data);

      // TODO: Здесь должна быть логика:
      // 1. Получить ключ шифрования для chatId (это должно быть сделано безопасно, ключ не должен передаваться от клиента)
      //    Сервер может иметь доступ к ключам или получать их из защищенного хранилища.
      //    Для E2E шифрования, сервер *не должен* расшифровывать сообщение, а только сохранять как есть.
      // const encryptionKey = await getKeyForChatOnServer(socket.chatId, socket.userId);
      // if (!encryptionKey) { /* обработка ошибки */ return; }

      // 2. Сохранить зашифрованное сообщение в Prisma
      // try {
      //   await prisma.message.create({
      //     data: {
      //       chatId: socket.chatId,
      //       userId: socket.userId,
      //       content: data.encryptedData, // Храним как есть (может быть base64 строка)
      //       iv: data.iv, // Храним как есть
      //     }
      //   });
      // } catch (dbError) {
      //   console.error('Ошибка сохранения сообщения в БД:', dbError);
      //   socket.emit('message_error', { message: 'Ошибка сохранения сообщения' });
      //   return;
      // }

      // 3. Переслать зашифрованное сообщение всем участникам комнаты (чата), включая отправителя
      // Сервер выступает как ретранслятор зашифрованных данных.
      chatNamespace.to(socket.chatId).emit('receive_message', {
        messageId: `msg_${Date.now()}`, // TODO: Генерировать ID на сервере или использовать из Prisma
        senderId: socket.userId,
        chatId: socket.chatId,
        data: data.encryptedData, // Зашифрованные данные
        iv: data.iv, // Вектор инициализации
        sentAt: new Date().toISOString(),
      });

      console.log(`Сообщение от ${socket.userId} переслано в чат ${socket.chatId}`);
    });

    socket.on('disconnect', (reason) => {
      console.log(`Клиент ${socket.id} (userId: ${socket.userId}) отключился от чата ${socket.chatId}. Причина: ${reason}`);
      // Дополнительная логика при отключении, если нужна (например, обновление статуса пользователя)
    });

    // Другие обработчики событий чата (typing, read receipts и т.д.)
    socket.on('typing', (isTyping: boolean) => {
      if (!socket.userId || !socket.chatId) return;
      socket.to(socket.chatId).emit('user_typing', { userId: socket.userId, isTyping });
    });

  });

  return io;
}

// Важно: этот файл должен быть импортирован и функция initSocketIOServer вызвана
// в вашем основном серверном файле Next.js, который обрабатывает HTTP запросы
// (например, в кастомном файле server.js или в API route, который инициализирует сервер).
// Next.js по умолчанию не запускает произвольный серверный код таким образом.
// Чаще всего Socket.IO интегрируют через API Route, который становится HTTP хендлером для Socket.IO.
// Пример: pages/api/socketio.ts 