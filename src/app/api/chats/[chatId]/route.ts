import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/prisma';
import { getCurrentUser, AuthenticatedUser } from '@/lib/auth';
import { handleApiError, ApiError } from '@/lib/api/apiErrorHandler';
import {
    ClientChat,
    ChatParticipant as ClientChatParticipantType,
    ChatLastMessage,
    UserRole,
    ChatWithDetails,
} from '@/types';

interface GetChatParams {
    params: {
        chatId: string;
    };
}

export async function GET(req: NextRequest, { params }: GetChatParams) {
    try {
        const currentUser: AuthenticatedUser | null = await getCurrentUser(req);
        if (!currentUser) {
            throw new ApiError('Пользователь не аутентифицирован', 401);
        }

        const { chatId } = params;
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
                    userId: currentUser.userId,
                },
            },
        });

        if (!participantRecord && !isAdmin) {
            throw new ApiError('Доступ запрещен: вы не участник этого чата', 403);
        }

        const chatFromDb: ChatWithDetails | null = await prisma.chat.findUnique({
            where: { id: chatId },
            include: {
                participants: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                username: true,
                                avatarUrl: true,
                            },
                        },
                    },
                },
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: limit,
                    include: {
                        sender: true,
                        readReceipts: true,
                    },
                },
            },
        });

        if (!chatFromDb) {
            throw new ApiError('Чат не найден', 404);
        }

        let chatName = chatFromDb.name;
        let chatAvatarUrl: string | null | undefined = chatFromDb.isGroupChat
            ? chatFromDb.avatarUrl
            : null;

        const chatParticipantsData: ClientChatParticipantType[] = chatFromDb.participants.map(
            p => ({
                id: p.user.id,
                username: p.user.username,
                avatarUrl: p.user.avatarUrl,
            })
        );

        if (!chatFromDb.isGroupChat) {
            const otherParticipantUser = chatFromDb.participants.find(
                p => p.userId !== currentUser.userId
            )?.user;
            if (otherParticipantUser) {
                chatName = otherParticipantUser.username;
                chatAvatarUrl = otherParticipantUser.avatarUrl;
            } else {
                chatName = chatFromDb.name || 'Личный чат';
            }
        }

        const lastMessageData =
            chatFromDb.messages && chatFromDb.messages.length > 0 ? chatFromDb.messages[0] : null;

        const lastMessageClient: ChatLastMessage | undefined = lastMessageData
            ? {
                  id: lastMessageData.id,
                  content: lastMessageData.content,
                  createdAt: lastMessageData.createdAt.toISOString(),
                  senderId: lastMessageData.sender.id,
                  senderUsername: lastMessageData.sender.username,
              }
            : undefined;

        const clientChat: ClientChat = {
            id: chatFromDb.id,
            name: chatName,
            isGroupChat: chatFromDb.isGroupChat,
            avatarUrl: chatAvatarUrl,
            members: chatParticipantsData,
            lastMessage: lastMessageClient,
            messages: chatFromDb.messages,
            // unreadCount не вычисляется для детального просмотра одного чата в этом эндпоинте
        };

        return NextResponse.json({ chat: clientChat });
    } catch (error) {
        return handleApiError(error);
    }
}
