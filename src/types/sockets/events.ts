import type { BasicUser } from '../user';
import type { MessageContentType, MessageReadReceipt } from '../message';

/**
 * Полезная нагрузка для события получения нового сообщения от сокет-сервера.
 * Этот тип должен быть максимально совместим с тем, что ожидает ChatListItem (тип Message из Prisma).
 */
export interface SocketMessagePayload {
    id: string; // ID сообщения из БД
    chatId: string; // ID чата
    sender: BasicUser; // Отправитель (облегченная версия)
    content: string; // Текстовое содержимое
    createdAt: Date; // Время создания (было timestamp)
    updatedAt: Date; // Время обновления
    contentType: MessageContentType; // Тип контента (text, image, system и т.д.)
    mediaUrl?: string | null; // URL для медиа-контента (если есть)
    readReceipts: MessageReadReceipt[]; // Теперь содержит MessageReadReceipt с полем id
    deletedAt?: Date | null; // Если сообщение удалено
    // Дополнительные поля, если они есть в вашем Prisma.Message и нужны клиенту:
    //parentId?: string | null;       // Для ответов на сообщения
    //metadata?: Record<string, any>; // Какие-либо метаданные
}

/**
 * Полезная нагрузка для событий присутствия пользователя (подключился/отключился).
 */
export interface SocketUserPresencePayload {
    chatId: string;
    userId: string;
    userEmail: string; // Можно заменить на user: BasicUser, если нужно больше данных
    // username?: string;
    // avatarUrl?: string | null;
}

// Можно также определить типы для данных, которые клиент отправляет на сервер, если они отличаются

export interface ClientSendMessagePayload {
    chatId: string;
    content: string;
    contentType?: MessageContentType; // Клиент может указать тип, по умолчанию 'text'
    mediaUrl?: string; // Если отправляется медиа
    // parentId?: string;   // Для ответа
}
