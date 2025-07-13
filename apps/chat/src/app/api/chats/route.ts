import { NextRequest, NextResponse } from 'next/server';
import { toChatListItem } from '@chat-app/core';
import { prisma, handleApiError, getCurrentUser } from '@/lib';

/**
 * GET /api/chats
 * Получает список чатов для текущего аутентифицированного пользователя.
 * Администраторы получают все чаты в системе.
 * Чаты сортируются по времени последнего сообщения (новые вверху).
 *
 * @returns {chats: ChatWithDetails[]} - Список чатов с полной информацией
 */
export async function GET(request: NextRequest) {
    try {
        const currentUser = await getCurrentUser(request);
        if (!currentUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Получаем чаты с правильными связями
        const prismaChats = await prisma.chat.findMany({
            orderBy: {
                updatedAt: 'desc',
            },
            where: {
                participants: {
                    some: {
                        userId: currentUser.id,
                    },
                },
            },
            include: {
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
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                    include: {
                        sender: true,
                        readReceipts: {
                            include: {
                                user: true,
                            },
                        },
                        actions: {
                            include: {
                                actor: true,
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
                                    none: {
                                        userId: currentUser.id,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        // Маппим данные в нужный формат для клиента
        const chats = prismaChats.map(chat => toChatListItem(chat, currentUser.id));

        return NextResponse.json({ chats });
    } catch (error) {
        return handleApiError(error);
    }
}
