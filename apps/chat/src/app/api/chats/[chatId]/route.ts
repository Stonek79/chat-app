import { NextRequest, NextResponse } from 'next/server';
import type { AuthenticatedUser, ChatWithDetails } from '@chat-app/core';
import { UserRole } from '@chat-app/db';
import { toChatWithDetails } from '@chat-app/core';
import { ApiError, getCurrentUser, handleApiError, prisma } from '@/lib';

interface GetChatParams {
    params: {
        chatId: string;
    };
}

/**
 * GET /api/chats/[chatId]
 * Получает детальную информацию о чате с его участниками и последним сообщением.
 * Возвращает единый тип ChatWithDetails для консистентности со всеми chat API.
 *
 * @param params.chatId - ID чата
 * @param searchParams.limit - Лимит сообщений (по умолчанию 50)
 * @returns {chat: ChatWithDetails} - Детальная информация о чате
 */
export async function GET(req: NextRequest, { params }: GetChatParams) {
    try {
        const currentUser: AuthenticatedUser | null = await getCurrentUser(req);
        if (!currentUser) {
            throw new ApiError('Пользователь не аутентифицирован', 401);
        }

        const { chatId } = await params;
        const limitParam = req.nextUrl.searchParams.get('limit');
        const limit = limitParam ? parseInt(limitParam, 10) : 50;

        if (isNaN(limit) || limit <= 0) {
            throw new ApiError('Некорректное значение для параметра limit', 400);
        }

        if (!chatId) {
            throw new ApiError('Необходим ID чата', 400);
        }

        const isAdmin = currentUser.role === UserRole.ADMIN;

        const participantRecord = await prisma.chatParticipant.findUnique({
            where: {
                chatId_userId: {
                    chatId: chatId,
                    userId: currentUser.id,
                },
            },
        });

        if (!participantRecord || !isAdmin) {
            throw new ApiError('Доступ запрещен: вы не участник этого чата', 403);
        }

        const chatFromDb = await prisma.chat.findUnique({
            where: { id: chatId },
            include: {
                participants: {
                    include: {
                        user: true,
                    },
                },
                messages: {
                    orderBy: { createdAt: 'asc' },
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
                        participants: true,
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

        if (!chatFromDb) {
            throw new ApiError('Чат не найден', 404);
        }

        // Используем mapper из core для создания правильного объекта
        const chatWithDetails: ChatWithDetails = toChatWithDetails(chatFromDb, currentUser.id);

        return NextResponse.json({ chat: chatWithDetails });
    } catch (error) {
        return handleApiError(error);
    }
}
