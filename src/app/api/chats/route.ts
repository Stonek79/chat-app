import { NextResponse, NextRequest } from 'next/server';
import {
    getCurrentUser,
    prisma,
    handleApiError,
    ApiError,
    mapPrismaChatToClientChat,
    PrismaChatWithDetails,
} from '@/lib';
import type { ClientChat, AuthenticatedUser } from '@/types';
import { UserRoleEnum } from '@/constants';

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
                    actions: true,
                },
            },
            _count: {
                select: {
                    messages: {
                        where: {
                            senderId: { not: currentUser.id },
                            readReceipts: {
                                none: {
                                    userId: currentUser.id,
                                },
                            },
                        },
                    },
                },
            },
        };

        if (isAdmin) {
            rawChatsFromDb = await prisma.chat.findMany({
                include: commonChatIncludes,
            });
        } else {
            // Обычный пользователь получает только те чаты, в которых он является участником
            // Запрос изменен, чтобы соответствовать структуре PrismaChatWithDetails напрямую
            rawChatsFromDb = await prisma.chat.findMany({
                where: {
                    participants: {
                        some: { userId: currentUser.id },
                    },
                },
                include: commonChatIncludes,
            });
        }

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
        let dedupedClientChats = Array.from(uniqueClientChatsMap.values());

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
