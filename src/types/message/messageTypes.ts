import { type MessageContentType,type MessageReadReceipt, Prisma } from '@prisma/client';
import { z } from 'zod';

import type { displayMessageSchema } from '@/schemas';

import type { Chat, PrismaChatParticipant } from '../chat';
import type { BasicUser, User } from '../user';

export { MessageContentType,MessageReadReceipt };

export type Message = Prisma.MessageGetPayload<{
    include: {
        sender: true; // Включаем связанную модель User
        readReceipts: true; // Включаем связанные MessageReadReceipt
        actions: {
            include: {
                actor: {
                    select: {
                        id: true;
                        username: true;
                    };
                };
            };
        };
    };
}>;

// Тип для участника чата с выбранными полями пользователя
export type ChatParticipantWithUser = PrismaChatParticipant & {
    user: Pick<User, 'id' | 'username' | 'avatarUrl' | 'email' | 'role'>;
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
 * @description Тип для сообщения, готового к отображению на клиенте.
 * Включает полную информацию об отправителе.
 * Выводится из Zod-схемы для гарантии синхронизации.
 */
export type DisplayMessage = z.infer<typeof displayMessageSchema>;

export type MessageAction = Prisma.MessageActionGetPayload<{
    include: {
        actor: {
            select: {
                id: true;
                username: true;
            };
        };
    };
}>;

export type ClientMessageAction = Omit<MessageAction, 'messageId' | 'actorId'>;

export type MessageDeletedPayload = {
    chatId: string;
    messageId: string;
    action: ClientMessageAction;
};
