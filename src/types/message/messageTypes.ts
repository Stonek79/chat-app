import { Prisma, type MessageContentType, type MessageReadReceipt } from '@prisma/client';
import type { Chat, PrismaChatParticipant } from '../chat';
import type { BasicUser, User } from '../user';

export { MessageReadReceipt, MessageContentType };

export type Message = Prisma.MessageGetPayload<{
    include: {
        sender: true; // Включаем связанную модель User
        readReceipts: true; // Включаем связанные MessageReadReceipt
    };
}>;

// Тип для участника чата с выбранными полями пользователя
export type ChatParticipantWithUser = PrismaChatParticipant & {
    user: Pick<User, 'id' | 'username' | 'avatarUrl' | 'email' | 'role' >;
};

// Тип для сообщения со всеми необходимыми включениями (детализированное сообщение)
// Это будет тип данных, приходящих из Prisma для каждого сообщения в чате
export type DetailedChatMessage = Message & {
    sender: User; // Полный объект User для отправителя
    readReceipts: MessageReadReceipt[];
};

// Тип для полного объекта чата, возвращаемого GET /api/chats/[chatId]
export type ChatWithDetails = Chat & {
    participants: ChatParticipantWithUser[];
    messages: DetailedChatMessage[];
};

export type MessageReadReceiptDisplay = Pick<MessageReadReceipt, 'userId' | 'readAt'>;

/**
 * Тип сообщения, оптимизированный для отображения в UI (например, в ChatListItem).
 * Содержит только необходимые поля.
 */
export interface DisplayMessage {
    id?: string; // ID сообщения
    chatId: string; // ID чата
    sender: BasicUser; // Отправитель (облегченная версия)
    content: string; // Текстовое содержимое
    createdAt: Date; // Время создания (всегда Date)
    updatedAt?: Date | null; // Время обновления (всегда Date)
    contentType: MessageContentType; // Тип контента
    mediaUrl?: string | null; // URL для медиа-контента
    readReceipts?: MessageReadReceiptDisplay[]; // Статусы прочтения (опционально для отображения)
    deletedAt?: Date | null; // Если сообщение удалено (всегда Date или null)
    isCurrentUser?: boolean; // Флаг, является ли сообщение от текущего пользователя (для UI)
    isEdited?: boolean; // Флаг, является ли сообщение отредактированным (для UI)
    // Можно добавить другие флаги или вычисляемые поля, специфичные для UI
    // Например, isEdited, isPinned, isFirstInSequence, etc.
}
