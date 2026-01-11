import { NextRequest, NextResponse } from 'next/server';
import { ERROR_MESSAGES, HTTP_STATUS, toChatListItem } from '@chat-app/core';
import { prisma, ApiError, handleApiError, getCurrentUser } from '@/lib';

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
            return new ApiError(ERROR_MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED);
        }

        const isAdmin = currentUser.role === 'ADMIN';

        const limit = parseInt(request.nextUrl.searchParams.get('limit') || '20');
        const cursor = request.nextUrl.searchParams.get('cursor'); // timestamp

        const queryLimit = Math.min(Math.max(limit, 1), 50);

        const whereClause: any = isAdmin ? {} : {
            participants: {
                some: {
                    userId: currentUser.id,
                },
            },
        };

        if (cursor) {
            whereClause.updatedAt = {
                lt: new Date(cursor),
            };
        }

        // Получаем чаты с правильными связями
        const prismaChats = await prisma.chat.findMany({
            orderBy: {
                updatedAt: 'desc',
            },
            take: queryLimit + 1, // +1 для проверки следующей страницы
            where: whereClause,
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

        let nextCursor: string | null = null;
        if (prismaChats.length > queryLimit) {
            const nextItem = prismaChats.pop(); // Удаляем лишний элемент
            nextCursor = nextItem?.updatedAt.toISOString() || null;
        }

        // Маппим данные в нужный формат для клиента
        const chats = prismaChats.map(chat => {
            const isParticipant = chat.participants.some(p => p.userId === currentUser.id);
            // Если админ не является участником, не показываем ему счетчик непрочитанных (Ghost Mode)
            // Иначе он будет видеть все сообщения как непрочитанные
            if (!isParticipant && isAdmin) {
                chat._count.messages = 0;
            }
            return toChatListItem(chat, currentUser.id);
        });

        return NextResponse.json({ chats, nextCursor });
    } catch (error) {
        return handleApiError(error);
    }
}
