import { NextRequest, NextResponse } from 'next/server';

import { UserRoleEnum } from '@/constants';
import {
    ApiError,
    getCurrentUser,
    handleApiError,
    mapPrismaChatToClientChat,
    prisma,
    PrismaChatWithDetails,
} from '@/lib';
import type { AuthenticatedUser, ClientChat } from '@/types';

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
        // Тип PrismaChatWithDetails теперь определяет структуру, которую ожидает commonChatIncludes
        const commonChatIncludes = {
            participants: {
                include: {
                    user: {
                        select: {
                            id: true,
                            username: true,
                            avatarUrl: true,
                            email: true,
                            role: true,
                        },
                    },
                },
            },
            messages: {
                orderBy: { createdAt: 'desc' as const },
                take: 1,
                include: {
                    sender: true,
                    readReceipts: true,
                    actions: {
                        include: {
                            actor: {
                                select: {
                                    id: true,
                                    username: true,
                                },
                            },
                        },
                    },
                },
            },
            _count: {
                select: {
                    messages: {
                        where: {
                            senderId: { not: currentUser.id },
                            readReceipts: {
                                some: {
                                    userId: currentUser.id,
                                },
                            },
                        },
                    },
                },
            },
        };

        // Обычный пользователь получает только те чаты, в которых он является участником.
        rawChatsFromDb = await prisma.chat.findMany({
            where: {
                participants: {
                    some: { userId: currentUser.id },
                },
            },
            include: commonChatIncludes,
        });

        if (!rawChatsFromDb || rawChatsFromDb.length === 0) {
            return NextResponse.json({ chats: [] });
        }

        const clientChats: ClientChat[] = rawChatsFromDb
            .map(chatDb => mapPrismaChatToClientChat(chatDb, currentUser.id))
            .filter(Boolean) as ClientChat[];

        const uniqueClientChatsMap = new Map<string, ClientChat>();
        clientChats.forEach(chat => {
            if (chat && chat.id) {
                uniqueClientChatsMap.set(chat.id, chat);
            }
        });
        const dedupedClientChats = Array.from(uniqueClientChatsMap.values());

        dedupedClientChats.sort((a, b) => {
            const timeA = a.lastMessage?.createdAt
                ? new Date(a.lastMessage.createdAt).getTime()
                : 0;
            const timeB = b.lastMessage?.createdAt
                ? new Date(b.lastMessage.createdAt).getTime()
                : 0;
            return timeB - timeA;
        });

        return NextResponse.json({ chats: dedupedClientChats });
    } catch (error) {
        return handleApiError(error);
    }
}
