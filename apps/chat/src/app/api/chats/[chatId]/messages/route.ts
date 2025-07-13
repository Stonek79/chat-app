import { NextRequest, NextResponse } from 'next/server';
import { toDisplayMessage } from '@chat-app/core';
import { ApiError, getCurrentUser, handleApiError, prisma } from '@/lib';

interface GetMessagesParams {
    params: {
        chatId: string;
    };
}

const DEFAULT_MESSAGES_LIMIT = 50;

/**
 * GET /api/chats/[chatId]/messages
 * Получает список сообщений для чата с курсорной пагинацией.
 *
 * @param req.nextUrl.searchParams.limit - Лимит сообщений
 * @param req.nextUrl.searchParams.cursor - ID сообщения, с которого начинать выборку (для пагинации)
 * @returns { messages: DisplayMessage[], nextCursor: string | null }
 */
export async function GET(req: NextRequest, { params }: GetMessagesParams) {
    try {
        const currentUser = await getCurrentUser(req);
        if (!currentUser) {
            throw new ApiError('Пользователь не аутентифицирован', 401);
        }

        const { chatId } = await params;
        if (!chatId) {
            throw new ApiError('Необходим ID чата', 400);
        }

        // Проверяем, является ли пользователь участником чата
        const participant = await prisma.chatParticipant.findUnique({
            where: {
                chatId_userId: {
                    chatId,
                    userId: currentUser.id,
                },
            },
        });

        if (!participant) {
            throw new ApiError('Доступ запрещен: вы не участник этого чата', 403);
        }

        const limit = Number(req.nextUrl.searchParams.get('limit')) || DEFAULT_MESSAGES_LIMIT;
        const cursor = req.nextUrl.searchParams.get('cursor') || undefined;

        // Если курсора нет, это первая загрузка. Проверяем наличие непрочитанных.
        if (!cursor) {
            const unreadCountQuery = prisma.message.count({
                where: {
                    chatId,
                    createdAt: { gt: participant.joinedAt },
                    NOT: { senderId: currentUser.id },
                    readReceipts: { none: { userId: currentUser.id } },
                },
            });

            const firstUnreadQuery = prisma.message.findFirst({
                where: {
                    chatId,
                    createdAt: { gt: participant.joinedAt },
                    NOT: { senderId: currentUser.id },
                    readReceipts: { none: { userId: currentUser.id } },
                },
                orderBy: { createdAt: 'asc' },
            });

            const [unreadCount, firstUnread] = await Promise.all([
                unreadCountQuery,
                firstUnreadQuery,
            ]);

            if (firstUnread) {
                let messages: any[] = [];
                let nextCursor: string | null = null;

                if (unreadCount < limit) {
                    // Непрочитанных меньше лимита: грузим все непрочитанные и добиваем лимит прочитанными
                    const readMessagesToFetch = limit - unreadCount;
                    const unreadMessages = await prisma.message.findMany({
                        where: { id: { gte: firstUnread.id }, chatId },
                        orderBy: { createdAt: 'asc' },
                        include: {
                            sender: true,
                            readReceipts: { include: { user: true } },
                            actions: { include: { actor: true } },
                        },
                    });
                    const readMessages = await prisma.message.findMany({
                        where: { id: { lt: firstUnread.id }, chatId },
                        take: readMessagesToFetch,
                        orderBy: { createdAt: 'desc' },
                        include: {
                            sender: true,
                            readReceipts: { include: { user: true } },
                            actions: { include: { actor: true } },
                        },
                    });
                    messages = [...readMessages.reverse(), ...unreadMessages];
                    if (readMessages.length === readMessagesToFetch) {
                        nextCursor = readMessages[readMessages.length - 1]?.id || null;
                    }
                } else {
                    // Непрочитанных больше лимита: грузим одно прочитанное и `limit - 1` непрочитанных
                    const lastReadMessage = await prisma.message.findFirst({
                        where: { id: { lt: firstUnread.id }, chatId },
                        orderBy: { createdAt: 'desc' },
                        include: {
                            sender: true,
                            readReceipts: { include: { user: true } },
                            actions: { include: { actor: true } },
                        },
                    });

                    const unreadMessages = await prisma.message.findMany({
                        where: { id: { gte: firstUnread.id }, chatId },
                        take: limit - 1,
                        orderBy: { createdAt: 'asc' },
                        include: {
                            sender: true,
                            readReceipts: { include: { user: true } },
                            actions: { include: { actor: true } },
                        },
                    });

                    if (lastReadMessage) {
                        messages = [lastReadMessage, ...unreadMessages];
                        nextCursor = lastReadMessage.id;
                    } else {
                        messages = unreadMessages;
                    }
                }

                const displayMessages = messages.map(message =>
                    toDisplayMessage(message, currentUser.id)
                );

                return NextResponse.json({
                    messages: displayMessages,
                    nextCursor,
                    firstUnreadId: firstUnread.id,
                });
            }
        }

        // Старая логика для пагинации или если непрочитанных нет
        const messagesFromDb = await prisma.message.findMany({
            where: {
                chatId,
            },
            take: limit + 1, // Загружаем на один больше, чтобы определить hasMore
            ...(cursor && {
                cursor: { id: cursor },
            }),
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
            orderBy: {
                createdAt: 'desc',
            },
        });

        let nextCursor: string | null = null;
        if (messagesFromDb.length > limit) {
            nextCursor = messagesFromDb.pop()!.id;
        }

        const displayMessages = messagesFromDb.map(message =>
            toDisplayMessage(message, currentUser.id)
        );

        return NextResponse.json({
            messages: displayMessages.reverse(),
            nextCursor,
        });
    } catch (error) {
        return handleApiError(error);
    }
}
