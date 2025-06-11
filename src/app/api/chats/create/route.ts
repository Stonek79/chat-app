import { NextRequest, NextResponse } from 'next/server';

import { ChatParticipantRoleEnum } from '@/constants';
import {
    ApiError,
    getCurrentUser,
    getRedisPublisher,
    handleApiError,
    mapPrismaChatToClientChat,
    prisma,
} from '@/lib';
import { createGroupChatSchema, createPrivateChatSchema } from '@/schemas';
import type { AuthenticatedUser } from '@/types';

/**
 * API маршрут для создания нового чата (личного или группового).
 * Логика определяется на основе тела запроса.
 * @param {NextRequest} request - Запрос на создание чата.
 * @returns {Promise<NextResponse>} Ответ сервера.
 */
export async function POST(request: NextRequest) {
    try {
        const currentUser: AuthenticatedUser | null = await getCurrentUser(request);
        if (!currentUser) {
            throw new ApiError('Неавторизован', 401);
        }
        const creatorId = currentUser.id;

        const body = await request.json();

        // Определяем, это групповой или личный чат
        const isGroupChat = 'name' in body && 'memberIds' in body;

        let newChatWithDetails;

        if (isGroupChat) {
            // --- Логика для ГРУППОВОГО чата ---
            const validationResult = createGroupChatSchema.safeParse(body);
            if (!validationResult.success) {
                throw new ApiError(
                    'Ошибка валидации данных для группового чата',
                    400,
                    validationResult.error.flatten().fieldErrors
                );
            }
            const { name, memberIds } = validationResult.data;

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
                    },
                });

                const participantsToCreate = [
                    { chatId: chat.id, userId: creatorId, role: ChatParticipantRoleEnum.OWNER },
                    ...memberIds.map(id => ({
                        chatId: chat.id,
                        userId: id,
                        role: ChatParticipantRoleEnum.MEMBER,
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
            const validationResult = createPrivateChatSchema.safeParse(body);
            if (!validationResult.success) {
                throw new ApiError(
                    'Ошибка валидации данных для приватного чата',
                    400,
                    validationResult.error.flatten().fieldErrors
                );
            }
            const { recipientId } = validationResult.data;

            if (recipientId === creatorId) {
                throw new ApiError('Нельзя создать чат с самим собой.', 400);
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
                const clientChat = mapPrismaChatToClientChat(existingChat, creatorId);
                return NextResponse.json(clientChat, { status: 200 }); // Статус 200, так как не создаем новый
            }

            newChatWithDetails = await prisma.$transaction(async tx => {
                const chat = await tx.chat.create({
                    data: {
                        isGroupChat: false,
                    },
                });

                await tx.chatParticipant.createMany({
                    data: [
                        {
                            chatId: chat.id,
                            userId: creatorId,
                            role: ChatParticipantRoleEnum.MEMBER,
                        },
                        {
                            chatId: chat.id,
                            userId: recipientId,
                            role: ChatParticipantRoleEnum.MEMBER,
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

        const clientChat = mapPrismaChatToClientChat(newChatWithDetails, creatorId);

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
                const redisPub = await getRedisPublisher();
                if (redisPub) {
                    await redisPub.publish(redisChannel, JSON.stringify(notificationPayload));
                    console.log(
                        `[API Create Chat] Published NEW_CHAT event to Redis for chat ${clientChat.id}`
                    );
                } else {
                    console.error('[API Create Chat] Redis publisher is not available.');
                }
            } catch (redisError) {
                console.error(
                    '[API Create Chat] Failed to publish NEW_CHAT event to Redis:',
                    redisError
                );
            }
        }

        return NextResponse.json(clientChat, { status: 201 });
    } catch (error) {
        return handleApiError(error);
    }
}
