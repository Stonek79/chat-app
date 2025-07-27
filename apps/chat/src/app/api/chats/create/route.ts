import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import type { AuthenticatedUser } from '@chat-app/core';
import { toChatWithDetailsFromPartial, createChatSchema } from '@chat-app/core';
import { ChatParticipantRole } from '@chat-app/db';

import { ApiError, getCurrentUser, handleApiError, prisma } from '@/lib';
// import { publishNotification } from '@chat-app/server-shared';

/**
 * POST /api/chats/create
 * Создает новый чат (групповой или приватный).
 * Возвращает единый тип ChatWithDetails для консистентности со всеми chat API.
 *
 * @param body.name - Название чата (обязательно для групповых чатов)
 * @param body.isGroupChat - Тип чата (групповой или приватный)
 * @param body.participantIds - ID участников чата
 * @returns {chat: ChatWithDetails} - Созданный или существующий чат
 */
export async function POST(request: NextRequest) {
    try {
        const currentUser: AuthenticatedUser | null = await getCurrentUser(request);
        if (!currentUser) {
            throw new ApiError('Неавторизован', 401);
        }
        const creatorId = currentUser.id;

        const body = await request.json();

        // Валидация с единой схемой
        const validationResult = createChatSchema.safeParse(body);
        if (!validationResult.success) {
            throw new ApiError(
                'Ошибка валидации данных для чата',
                400,
                validationResult.error.flatten().fieldErrors
            );
        }

        const { name, isGroupChat, participantIds } = validationResult.data;

        let newChatWithDetails;

        if (isGroupChat) {
            // --- Логика для ГРУППОВОГО чата ---
            const memberIds = participantIds;

            if (memberIds.includes(creatorId)) {
                throw new ApiError('Создатель не может быть в списке участников.', 400);
            }

            // Проверяем, что все участники существуют
            const membersExist = await prisma.user.count({ where: { id: { in: memberIds } } });
            if (membersExist !== memberIds.length) {
                throw new ApiError('Один или несколько участников не найдены.', 404);
            }

            newChatWithDetails = await prisma.$transaction(async tx => {
                const chat = await tx.chat.create({
                    data: {
                        name: name,
                        isGroupChat: true,
                        updatedAt: new Date(),
                    },
                });

                const participantsToCreate = [
                    {
                        chatId: chat.id,
                        userId: creatorId,
                        role: ChatParticipantRole.OWNER,
                    },
                    ...memberIds.map(id => ({
                        chatId: chat.id,
                        userId: id,
                        role: ChatParticipantRole.MEMBER,
                    })),
                ];

                await tx.chatParticipant.createMany({
                    data: participantsToCreate,
                });

                // Возвращаем созданный чат с деталями для маппинга
                return tx.chat.findUniqueOrThrow({
                    where: { id: chat.id },
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
                    },
                });
            });
        } else {
            // --- Логика для ПРИВАТНОГО чата ---
            if (participantIds.length !== 1) {
                throw new ApiError('Для приватного чата необходим ровно один участник.', 400);
            }

            const recipientId = participantIds[0];

            if (!recipientId) {
                throw new ApiError('ID получателя не может быть пустым.', 400);
            }

            if (recipientId === creatorId) {
                throw new ApiError('Нельзя создать чат с самим собой.', 400);
            }

            // Проверяем, что получатель существует
            const recipientExists = await prisma.user.findUnique({
                where: { id: recipientId },
                select: { id: true },
            });

            if (!recipientExists) {
                throw new ApiError('Получатель не найден.', 404);
            }

            // Проверка на существование приватного чата между этими двумя пользователями
            const existingChat = await prisma.chat.findFirst({
                where: {
                    isGroupChat: false,
                    AND: [
                        { participants: { some: { userId: creatorId } } },
                        { participants: { some: { userId: recipientId } } },
                    ],
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
                },
            });

            if (existingChat) {
                const clientChat = toChatWithDetailsFromPartial({
                    prismaChat: existingChat,
                    currentUserId: creatorId,
                });
                return NextResponse.json({ chat: clientChat }, { status: 200 }); // Статус 200, так как не создаем новый
            }

            newChatWithDetails = await prisma.$transaction(async tx => {
                const chat = await tx.chat.create({
                    data: {
                        isGroupChat: false,
                        updatedAt: new Date(),
                    },
                });

                await tx.chatParticipant.createMany({
                    data: [
                        {
                            chatId: chat.id,
                            userId: creatorId,
                            role: ChatParticipantRole.MEMBER,
                        },
                        {
                            chatId: chat.id,
                            userId: recipientId,
                            role: ChatParticipantRole.MEMBER,
                        },
                    ],
                });

                // Возвращаем созданный чат с деталями для маппинга
                return tx.chat.findUniqueOrThrow({
                    where: { id: chat.id },
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
                    },
                });
            });
        }

        const clientChat = toChatWithDetailsFromPartial({
            prismaChat: newChatWithDetails,
            currentUserId: creatorId,
        });

        if (clientChat) {
            try {
                const notificationPayload = {
                    type: 'NEW_CHAT',
                    data: {
                        chatData: clientChat,
                        initiatorUserId: creatorId,
                    },
                };
                const redisChannel =
                    process.env.REDIS_SOCKET_NOTIFICATIONS_CHANNEL || 'socket-notifications';
                // await publishNotification(redisChannel, notificationPayload);
                console.log(
                    `[API Create Chat] Published NEW_CHAT event to Redis for chat ${clientChat.id}`
                );
            } catch (redisError) {
                console.error(
                    '[API Create Chat] Failed to publish NEW_CHAT event to Redis:',
                    redisError
                );
            }
        }

        return NextResponse.json({ chat: clientChat }, { status: 201 });
    } catch (error) {
        return handleApiError(error);
    }
}
