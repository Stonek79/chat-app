import { z } from 'zod';

import { clientChatSchema } from '@/schemas';
import type {
    Chat as PrismaChat,
    ClientChat,
    Message as PrismaMessage,
    MessageAction,
    MessageReadReceipt,
    PrismaChatParticipant,
    User as PrismaUser,
} from '@/types';

import { mapPrismaMessageToDisplayMessage } from './messageMappers';

/**
 * @description Расширенный тип для чата Prisma, включающий связанные данные об участниках и сообщениях,
 * необходимые для формирования представления чата на стороне клиента.
 * @примечание Поле `role` в `PrismaChatParticipant` будет иметь тип `ChatParticipantRole`.
 */
export type PrismaChatWithDetails = PrismaChat & {
    participants: (PrismaChatParticipant & {
        user: Pick<PrismaUser, 'id' | 'username' | 'avatarUrl' | 'email' | 'role'>;
    })[];
    messages: (PrismaMessage & {
        readReceipts: MessageReadReceipt[];
        sender: Pick<PrismaUser, 'id' | 'username' | 'email' | 'avatarUrl'>;
        actions: MessageAction[];
    })[];
    _count?: {
        messages: number;
    };
    creatorId?: string | null;
};

/**
 * @description Преобразует объект чата Prisma (с деталями) в формат `ClientChat`, подходящий для клиента.
 *
 * @param {ChatWithDetails} chat - Объект чата из базы данных, включая участников и последние сообщения.
 * @param {string} currentUserId - ID текущего аутентифицированного пользователя, необходимый для
 *                                 корректного определения имени и аватара приватного чата.
 * @returns {ClientChat} Клиентский безопасный объект чата.
 */
export const mapPrismaChatToClientChat = (
    chatDb: PrismaChatWithDetails,
    currentUserId: string
): ClientChat => {
    if (!chatDb) {
        throw new Error('mapPrismaChatToClientChat: chatDb is null or undefined');
    }

    const {
        id,
        name,
        isGroupChat,
        creatorId,
        participants,
        messages,
        createdAt,
        updatedAt,
        _count: count,
    } = chatDb;

    const lastMessage = messages?.[0] ? mapPrismaMessageToDisplayMessage(messages[0]) : null;

    let chatName = name;
    let chatAvatar = null;

    if (!isGroupChat && participants.length === 2) {
        const otherParticipant = participants.find(p => p.user.id !== currentUserId);
        if (otherParticipant?.user) {
            chatName = otherParticipant.user.username;
            chatAvatar = otherParticipant.user.avatarUrl;
        } else {
            // Запасной вариант для чатов только с текущим пользователем (например, "Избранное")
            chatName = participants[0]?.user.username ?? 'Личный чат';
            chatAvatar = participants[0]?.user.avatarUrl ?? null;
        }
    }

    const finalAvatarUrl =
        chatAvatar && z.string().url().safeParse(chatAvatar).success ? chatAvatar : null;

    const clientChat = {
        id,
        name: chatName,
        isGroupChat,
        creatorId,
        members: participants.map(p => ({
            id: p.user.id,
            username: p.user.username,
            avatarUrl: p.user.avatarUrl,
            email: p.user.email,
            role: p.role,
        })),
        lastMessage,
        avatarUrl: finalAvatarUrl,
        unreadCount: count?.messages,
        createdAt,
        updatedAt,
    };

    return clientChatSchema.parse(clientChat);
};
