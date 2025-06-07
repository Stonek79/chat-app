import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
    getRedisPublisher,
    getCurrentUser,
    prisma,
    handleApiError,
    ApiError,
    mapPrismaChatToClientChat,
} from '@/lib';
import type { AuthenticatedUser } from '@/types';
import { ChatParticipantRoleEnum } from '@/constants';

// Схема валидации для создания чата
const createChatSchema = z.object({
    name: z.string().min(1).max(30).optional(), // Обязательно для групповых, опционально для приватных
    participantIds: z
        .array(z.string().cuid())
        .min(1, 'Должен быть как минимум один участник (помимо создателя для групповых)'),
    isGroupChat: z.boolean(),
});

// Тип для данных запроса после валидации
type CreateChatPayload = z.infer<typeof createChatSchema>;

/**
 * API маршрут для создания нового чата.
 * @param {NextRequest} request - Запрос на создание чата.
 * @returns {Promise<NextResponse>} Ответ сервера.
 */
export async function POST(request: NextRequest) {
    try {
        const currentUser: AuthenticatedUser | null = await getCurrentUser(request);
        if (!currentUser) {
            throw new ApiError('Неавторизован', 401);
        }
        const creatorId = currentUser.userId;

        const body = await request.json();
        const validationResult = createChatSchema.safeParse(body);

        if (!validationResult.success) {
            // Собираем ошибки валидации в более читаемый формат
            const errors = validationResult.error.flatten().fieldErrors;
            console.warn('Validation errors:', JSON.stringify(errors, null, 2));
            const errorMessages = Object.values(errors).flat().join(', ');
            throw new ApiError(`Ошибка валидации: ${errorMessages}`, 400, errors);
        }

        const { name, participantIds, isGroupChat }: CreateChatPayload = validationResult.data;

        // Дополнительная логика валидации в зависимости от типа чата
        if (isGroupChat && (!name || name.trim() === '')) {
            throw new ApiError('Имя группового чата обязательно', 400);
        }
        if (!isGroupChat && participantIds.length !== 1) {
            // Для приватного чата ожидается один ID собеседника. Создатель добавляется автоматически.
            throw new ApiError('Для приватного чата должен быть указан один ID собеседника', 400);
        }
        if (participantIds.includes(creatorId)) {
            throw new ApiError('Создатель не может быть в списке участников для добавления.', 400);
        }

        let newChatWithDetails;

        if (!isGroupChat) {
            // --- Логика для ПРИВАТНОГО чата ---
            const otherUserId = participantIds[0];

            // Проверка на существование приватного чата между этими двумя пользователями
            const existingChat = await prisma.chat.findFirst({
                where: {
                    isGroupChat: false,
                    AND: [
                        { participants: { some: { userId: creatorId } } },
                        { participants: { some: { userId: otherUserId } } },
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
                                },
                            },
                        },
                    },
                    messages: {
                        orderBy: { createdAt: 'desc' },
                        take: 1,
                        include: { sender: true, readReceipts: true },
                    },
                },
            });

            if (existingChat) {
                // Если чат уже существует, просто возвращаем его
                const clientChat = mapPrismaChatToClientChat(existingChat, creatorId);
                return NextResponse.json(clientChat, { status: 200 }); // Статус 200, так как не создаем новый
            }

            newChatWithDetails = await prisma.$transaction(async tx => {
                const chat = await tx.chat.create({
                    data: {
                        isGroupChat: false,
                        // Имя для приватных чатов не устанавливается на сервере
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
                            userId: otherUserId,
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
                                    },
                                },
                            },
                        },
                        messages: {
                            orderBy: { createdAt: 'desc' },
                            take: 1,
                            include: { sender: true, readReceipts: true },
                        },
                    },
                });
            });
        } else {
            // --- Логика для ГРУППОВОГО чата ---
            if (participantIds.length === 0) {
                throw new ApiError(
                    'В групповом чате должен быть как минимум один добавленный участник (помимо создателя).',
                    400
                );
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
                    ...participantIds.map(id => ({
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
                                    },
                                },
                            },
                        },
                        messages: {
                            orderBy: { createdAt: 'desc' },
                            take: 1,
                            include: { sender: true, readReceipts: true },
                        },
                    },
                });
            });
        }

        const clientChat = mapPrismaChatToClientChat(newChatWithDetails, creatorId);

        if (clientChat) {
            // Убедимся, что чат успешно смаплен
            // Шаг 1.7 - Интеграция с Socket.IO / Redis для уведомления участников
            try {
                const notificationPayload = {
                    type: 'NEW_CHAT', // Тип уведомления для обработки на socket-server
                    data: {
                        chatData: clientChat, // Данные уже в формате ClientChat
                        initiatorUserId: creatorId, // Пользователь, инициировавший создание
                    },
                };
                // Канал для уведомлений, на который подписан socket-server
                const redisChannel =
                    process.env.REDIS_SOCKET_NOTIFICATIONS_CHANNEL || 'socket-notifications';

                const redisPub = await getRedisPublisher(); // Получаем паблишер
                if (redisPub) {
                    await redisPub.publish(redisChannel, JSON.stringify(notificationPayload));
                    console.log(
                        `[API Create Chat] Published NEW_CHAT event to Redis channel ${redisChannel} for chat ${clientChat.id}`
                    );
                } else {
                    console.error(
                        '[API Create Chat] Redis publisher is not available. Could not publish NEW_CHAT event.'
                    );
                    // Здесь можно добавить более сложную логику обработки, если необходимо
                    // Например, поместить уведомление в очередь или записать в лог для последующей обработки
                }
            } catch (redisError) {
                console.error(
                    '[API Create Chat] Failed to publish NEW_CHAT event to Redis:',
                    redisError
                );
                // Не прерываем основной ответ из-за ошибки Redis, но логируем
            }
        }

        return NextResponse.json(clientChat, { status: 201 });
    } catch (error) {
        return handleApiError(error);
    }
}
