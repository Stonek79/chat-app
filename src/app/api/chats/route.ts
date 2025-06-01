import { NextResponse, NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib';
import { prisma } from '@/lib';
import { handleApiError, ApiError } from '@/lib/api/apiErrorHandler';
import type {
    ClientChat,
    ChatParticipant,
    ChatLastMessage,
    AuthenticatedUser,
    Chat as PrismaChat,
    PrismaChatParticipant,
    User as PrismaUser,
    Message as PrismaMessage,
} from '@/types';

import { UserRoleEnum } from '@/constants';

/**
 * Расширенный тип для Prisma Chat, включающий связанные данные участников и последних сообщений,
 * необходимые для формирования клиентского представления чата.
 */
type PrismaChatWithDetails = PrismaChat & {
    participants: (PrismaChatParticipant & {
        user: Pick<PrismaUser, 'id' | 'username' | 'avatarUrl' | 'email'>;
    })[];
    messages: (PrismaMessage & {
        sender: Pick<PrismaUser, 'id' | 'username'>;
    })[];
};

/**
 * Преобразует объект чата из Prisma (с деталями) в формат ClientChat, подходящий для клиента.
 *
 * @param chatDb - Объект чата из базы данных, включающий участников и последние сообщения.
 * @param currentUserId - ID текущего аутентифицированного пользователя, необходим для корректного
 *                        определения имени и аватара личного чата.
 * @returns Объект ClientChat или null, если входные данные некорректны.
 */
const mapPrismaChatToClientChat = (
    chatDb: PrismaChatWithDetails,
    currentUserId: string
): ClientChat | null => {
    if (!chatDb) {
        return null;
    }

    let chatName = chatDb.name;
    let chatAvatarUrl: string | null | undefined = chatDb.isGroupChat ? chatDb.avatarUrl : null;

    const chatParticipantsData: ChatParticipant[] = chatDb.participants.map(p => ({
        id: p.user.id,
        username: p.user.username,
        avatarUrl: p.user.avatarUrl,
        role: p.role,
        email: p.user.email,
    }));

    // Для личных чатов определяем имя и аватар на основе другого участника
    if (!chatDb.isGroupChat) {
        const otherParticipant = chatDb.participants.find(p => p.user.id !== currentUserId);
        if (otherParticipant && otherParticipant.user) {
            chatName = otherParticipant.user.username;
            chatAvatarUrl = otherParticipant.user.avatarUrl;
        } else {
            // Если другой участник не найден (например, чат с самим собой или устаревшие данные),
            // используем имя чата из БД или имя текущего пользователя как fallback.
            // Это также может быть сценарий, когда это новый чат и информация о собеседнике еще не полная.
            chatName =
                chatDb.name ||
                (chatParticipantsData.length === 1 && chatParticipantsData[0].id === currentUserId
                    ? chatParticipantsData[0].username // Имя текущего пользователя, если он единственный участник
                    : 'Личный чат');
            if (chatParticipantsData.length === 1 && chatParticipantsData[0].id === currentUserId) {
                chatAvatarUrl = chatParticipantsData[0].avatarUrl; // Аватар текущего пользователя
            }
        }
    }

    const lastMessageData =
        chatDb.messages && chatDb.messages.length > 0 ? chatDb.messages[0] : null;
    const lastMessageClient: ChatLastMessage | undefined = lastMessageData
        ? {
              id: lastMessageData.id,
              content: lastMessageData.content,
              createdAt: lastMessageData.createdAt,
              senderId: lastMessageData.sender.id,
              senderUsername: lastMessageData.sender.username,
          }
        : undefined;

    return {
        id: chatDb.id,
        name: chatName,
        isGroupChat: chatDb.isGroupChat,
        avatarUrl: chatAvatarUrl,
        members: chatParticipantsData,
        lastMessage: lastMessageClient,
    };
};

/**
 * GET /api/chats
 * Получает список чатов для текущего аутентифицированного пользователя.
 * Администраторы получают все чаты в системе.
 * Чаты сортируются по времени последнего сообщения (новые вверху).
 */
export async function GET(req: NextRequest) {
    try {
        const currentUser: AuthenticatedUser | null = await getCurrentUser(req);

        if (!currentUser) {
            throw new ApiError('Пользователь не аутентифицирован', 401);
        }

        const isAdmin = currentUser.role === UserRoleEnum.ADMIN;
        let rawChatsFromDb: PrismaChatWithDetails[] = [];

        // Общая конфигурация для включения связанных данных (участники и сообщения)
        const commonChatIncludes = {
            participants: {
                include: {
                    user: {
                        select: {
                            id: true,
                            username: true,
                            avatarUrl: true,
                            email: true,
                        },
                    },
                    // Для ChatParticipant все поля будут доступны по умолчанию, включая role
                },
            },
            messages: {
                orderBy: { createdAt: 'desc' as const },
                take: 1,
                include: {
                    sender: true, // Изменено: загружаем полного пользователя
                    readReceipts: true, // Добавлено: загружаем readReceipts
                },
            },
        };

        if (isAdmin) {
            // Администратор получает все чаты в системе
            rawChatsFromDb = await prisma.chat.findMany({
                include: commonChatIncludes,
            });
        } else {
            // Обычный пользователь получает только те чаты, в которых он является участником
            const userChatParticipantRecords = await prisma.chatParticipant.findMany({
                where: { userId: currentUser.userId },
                include: {
                    // Включаем полные данные чата для каждого участника
                    chat: { include: commonChatIncludes },
                },
            });
            // Извлекаем объекты чатов из записей участников
            // Фильтруем возможные null значения, если чат по какой-то причине отсутствует
            rawChatsFromDb = userChatParticipantRecords
                .map(cpRecord => cpRecord.chat)
                .filter(Boolean);
        }

        if (!rawChatsFromDb || rawChatsFromDb.length === 0) {
            return NextResponse.json({ chats: [] });
        }

        // Преобразование чатов из формата Prisma в клиентский формат ClientChat
        const clientChats: ClientChat[] = rawChatsFromDb
            .map(chatDb => mapPrismaChatToClientChat(chatDb, currentUser.userId))
            .filter(Boolean) as ClientChat[]; // Отфильтровываем null после маппинга, если были проблемы

        // Дедупликация чатов. Этот шаг важен, особенно если логика получения rawChatsFromDb
        // потенциально может вернуть дубликаты (например, если бы админ получал чаты через участников).
        // При прямом запросе prisma.chat.findMany для админа дубликатов быть не должно.
        const uniqueClientChatsMap = new Map<string, ClientChat>();
        clientChats.forEach(chat => {
            // Проверяем, что chat и chat.id существуют перед добавлением в Map
            if (chat && chat.id) {
                uniqueClientChatsMap.set(chat.id, chat);
            }
        });
        let dedupedClientChats = Array.from(uniqueClientChatsMap.values());

        // Сортировка чатов по дате последнего сообщения (новые вверху)
        dedupedClientChats.sort((a, b) => {
            const timeA = a.lastMessage?.createdAt
                ? new Date(a.lastMessage.createdAt).getTime()
                : 0;
            const timeB = b.lastMessage?.createdAt
                ? new Date(b.lastMessage.createdAt).getTime()
                : 0;
            return timeB - timeA; // Сортировка по убыванию времени
        });

        return NextResponse.json({ chats: dedupedClientChats });
    } catch (error) {
        return handleApiError(error);
    }
}

// TODO: POST /api/chats - для создания нового чата (личного или группового)
