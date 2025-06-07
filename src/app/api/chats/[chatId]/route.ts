import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, prisma, handleApiError, ApiError } from '@/lib';
import {
    ClientChat,
    ClientChatParticipant,
    ChatLastMessage,
    ChatWithDetails,
    AuthenticatedUser,
} from '@/types';
import { UserRoleEnum } from '@/constants';

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

        const { chatId } = await params;
        const limitParam = req.nextUrl.searchParams.get('limit');
        const limit = limitParam ? parseInt(limitParam, 10) : 50;

        if (isNaN(limit) || limit <= 0) {
            throw new ApiError('Некорректное значение для параметра limit', 400);
        }

        if (!chatId) {
            throw new ApiError('Необходим ID чата', 400);
        }

        const isAdmin = currentUser.role === UserRoleEnum.ADMIN;

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
                                email: true,
                                role: true,
                            },
                        },
                    },
                },
                messages: {
                    orderBy: { createdAt: 'asc' },
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

        const chatParticipantsData: ClientChatParticipant[] = chatFromDb.participants.map(
            p => ({
                id: p.user.id,
                username: p.user.username,
                avatarUrl: p.user.avatarUrl,
                role: p.role,
                email: p.user.email,
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
                  createdAt: lastMessageData.createdAt,
                  senderId: lastMessageData.sender.id,
                  senderUsername: lastMessageData.sender.username,
                  senderEmail: lastMessageData.sender.email,
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
        };

        return NextResponse.json({ chat: clientChat });
    } catch (error) {
        return handleApiError(error);
    }
}
