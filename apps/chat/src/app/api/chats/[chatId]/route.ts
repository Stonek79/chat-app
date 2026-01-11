import { NextRequest, NextResponse } from 'next/server';
import type { AuthenticatedUser, ChatWithDetails } from '@chat-app/core';
import { UserRole, ChatParticipantRole } from '@chat-app/db';
import { toChatWithDetailsFromPartial } from '@chat-app/core';
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

        if (!participantRecord && !isAdmin) {
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

        const unreadCount = chatFromDb._count?.messages ?? 0;

        // Используем mapper из core для создания правильного объекта
        const chatWithDetails: ChatWithDetails = toChatWithDetailsFromPartial({
            prismaChat: chatFromDb,
            currentUserId: currentUser.id,
        });

        return NextResponse.json({ chat: chatWithDetails });
    } catch (error) {
        return handleApiError(error);
    }
}

/**
 * DELETE /api/chats/[chatId]
 * Удаляет чат.
 */
export async function DELETE(
    request: NextRequest,
    props: { params: Promise<{ chatId: string }> }
) {
    try {
        const params = await props.params;
        const { chatId } = params;
        const currentUser = await getCurrentUser(request);

        if (!currentUser) {
            throw new ApiError('Неавторизован', 401);
        }

        if (!chatId) {
            throw new ApiError('ID чата обязателен', 400);
        }

        // Проверяем существование чата и права
        const chat = await prisma.chat.findUnique({
            where: { id: chatId },
            include: {
                participants: true,
            },
        });

        if (!chat) {
            throw new ApiError('Чат не найден', 404);
        }

        const participant = chat.participants.find(p => p.userId === currentUser.id);

        const isOwner = participant?.role === ChatParticipantRole.OWNER;
        const isAdmin = currentUser.role === 'ADMIN';

        // Удалять могут только Владелец чата или Глобальный Админ
        if (!isOwner && !isAdmin) {
            throw new ApiError('Нет прав на удаление чата', 403);
        }

        const memberIds = chat.participants.map(p => p.userId);

        // Транзакция на случай если нужно удалить связанные данные вручную
        await prisma.$transaction(async (tx) => {
            // Удаляем сообщения (если нет cascade)
            await tx.message.deleteMany({ where: { chatId } });
            // Удаляем участников (если нет cascade)
            await tx.chatParticipant.deleteMany({ where: { chatId } });
            // Удаляем сам чат
            await tx.chat.delete({ where: { id: chatId } });
        });

        // Уведомляем через Redis
        try {
            const notificationPayload = {
                type: 'CHAT_DELETED', // REDIS_EVENT_CHAT_DELETED
                data: {
                    chatId,
                    memberIds,
                    userId: currentUser.id,
                },
            };

            const redisChannel = process.env.REDIS_SOCKET_NOTIFICATIONS_CHANNEL || 'socket-notifications';
            // Используем динамический импорт или require, если publishNotification недоступен в scope
            // Но мы можем импортировать его в начале файла, если он там есть
            // Пока используем хардкод строки типа события, так как импорты могут быть не настроены
            
            const { publishNotification } = await import('@chat-app/server-shared');
             await publishNotification(redisChannel, notificationPayload);
             
             console.log(`[API Delete Chat] Published CHAT_DELETED event to Redis for chat ${chatId}`);

        } catch (redisError) {
             console.error('[API Delete Chat] Failed to publish CHAT_DELETED event to Redis:', redisError);
        }

        return NextResponse.json({ success: true, chatId });

    } catch (error) {
        return handleApiError(error);
    }
}
