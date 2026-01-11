import {
    CHAT_NAMESPACE,
    CLIENT_EVENT_MARK_AS_READ,
    CLIENT_EVENT_SEND_MESSAGE,
    SERVER_EVENT_RECEIVE_MESSAGE,
} from '@chat-app/socket-shared';
import type { AppSocketServer, AppSocket, ClientSendMessagePayload } from '@chat-app/socket-shared';

import { prisma } from '@chat-app/db';

async function handleSendMessage(
    io: AppSocketServer,
    socket: AppSocket,
    payload: ClientSendMessagePayload,
    ack?: (response: {
        success: boolean;
        messageId?: string;
        createdAt?: Date;
        error?: string;
    }) => void
) {
    try {
        const user = socket.data.user;
        if (!user) {
            throw new Error('Для отправки сообщений требуется аутентификация.');
        }

        // Валидация на уровне TypeScript, без Zod схемы
        if (!payload.chatId || !payload.content) {
            throw new Error('Ошибка валидации: chatId и content обязательны');
        }

        const {
            chatId,
            content,
            contentType = 'TEXT',
            clientTempId,
            replyToMessageId,
            mediaUrl,
        } = payload;

        console.log(`[Messages] User ${user.username} sending message to chat ${chatId}.`);

        const participant = await prisma.chatParticipant.findFirst({
            where: { userId: user.userId, chatId: chatId },
        });

        if (!participant) {
            throw new Error('Вы не являетесь участником этого чата.');
        }

        const [newMessage] = await prisma.$transaction([
            prisma.message.create({
                data: {
                    content,
                    contentType,
                    chatId,
                    senderId: user.userId,
                    updatedAt: new Date(),
                    replyToMessageId,
                    mediaUrl,
                },
                select: {
                    id: true,
                    chatId: true,
                    content: true,
                    contentType: true,
                    createdAt: true,
                    updatedAt: true,
                    sender: {
                        select: {
                            id: true,
                            username: true,
                            email: true,
                            avatarUrl: true,
                            role: true,
                        },
                    },
                    // Включаем данные об ответе в запрос
                    replyTo: {
                        select: {
                            id: true,
                            content: true,
                            contentType: true,
                            sender: {
                                select: {
                                    id: true,
                                    username: true,
                                    avatarUrl: true,
                                },
                            },
                        },
                    },
                },
            }),
            prisma.chat.update({
                where: { id: chatId },
                data: { updatedAt: new Date() },
            }),
        ]);

        if (!newMessage) {
            throw new Error('Не удалось создать сообщение.');
        }

        const messagePayload = {
            id: newMessage.id,
            chatId: newMessage.chatId,
            content: newMessage.content,
            contentType: newMessage.contentType,
            createdAt: newMessage.createdAt,
            updatedAt: newMessage.updatedAt,
            sender: {
                id: user.userId,
                username: user.username,
                avatarUrl: user.avatarUrl,
                role: user.role,
                email: user.email,
            },
            readReceipts: [],
            actions: [],
            clientTempId,
            replyTo: newMessage.replyTo
                ? {
                      id: newMessage.replyTo.id,
                      content: newMessage.replyTo.content,
                      contentType: newMessage.replyTo.contentType,
                      sender: {
                          id: newMessage.replyTo.sender.id,
                          username: newMessage.replyTo.sender.username,
                          avatarUrl: newMessage.replyTo.sender.avatarUrl,
                      },
                  }
                : undefined,
        };

        console.log('[ MESSAGE PAYLOAD ]', messagePayload);
        
        io.of(CHAT_NAMESPACE)
            .to(chatId)
            .emit(SERVER_EVENT_RECEIVE_MESSAGE, messagePayload);
        console.log(`[Messages] Message ${newMessage.id} sent to room ${chatId}.`);

        ack?.({
            success: true,
            messageId: newMessage.id,
            createdAt: newMessage.createdAt,
        });
    } catch (error) {
        const errorMessage =
            error instanceof Error
                ? error.message
                : 'Произошла неизвестная ошибка при отправке сообщения.';
        console.error(`[Messages] Error sending message:`, error);
        ack?.({ success: false, error: errorMessage });
    }
}

/**
 * Обрабатывает событие прочтения сообщения пользователем.
 * Обновляет lastReadMessageId для участника чата.
 * @param io - Экземпляр сервера Socket.IO.
 * @param socket - Сокет клиента.
 * @param payload - Данные события { chatId, messageId }.
 */
async function handleMarkAsRead(socket: AppSocket, payload: { chatId: string; messageId: string }) {
    const { user } = socket.data;
    if (!user) return;

    const { chatId, messageId } = payload;

    try {
        // 1. Находим сообщение, которое пользователь пометил как прочитанное
        const newMessage = await prisma.message.findUnique({
            where: { id: messageId },
            select: { createdAt: true },
        });

        if (!newMessage) return;

        // 2. Находим участника, чтобы получить ID его ТЕКУЩЕГО последнего прочитанного сообщения
        const participant = await prisma.chatParticipant.findUnique({
            where: { chatId_userId: { chatId, userId: user.userId } },
            select: { id: true, lastReadMessageId: true },
        });

        if (!participant) return;

        // 3. Если у него уже есть lastReadMessageId, делаем второй запрос, чтобы получить ДАТУ этого сообщения
        let lastReadDate: Date | null = null;
        if (participant.lastReadMessageId) {
            const lastReadMessage = await prisma.message.findUnique({
                where: { id: participant.lastReadMessageId },
                select: { createdAt: true },
            });
            lastReadDate = lastReadMessage?.createdAt ?? null;
        }

        // 4. Сравниваем даты: обновляем, только если новое сообщение было создано ПОЗЖЕ
        if (!lastReadDate || newMessage.createdAt > lastReadDate) {
            await prisma.chatParticipant.update({
                where: { id: participant.id },
                data: { lastReadMessageId: messageId },
            });
            console.log(
                `[MarkAsRead] User ${user.username} marked message ${messageId} as read in chat ${chatId}.`
            );
        }

        // 5. Создаем запись о прочтении (для корректного подсчета непрочитанных в API)
        await prisma.messageReadReceipt.upsert({
            where: {
                messageId_userId: {
                    messageId,
                    userId: user.userId,
                },
            },
            create: {
                messageId,
                userId: user.userId,
            },
            update: {},
        });
    } catch (error) {
        console.error(`[MarkAsRead] Error for user ${user.username} in chat ${chatId}:`, error);
    }
}

export const registerMessageHandlers = (io: AppSocketServer, socket: AppSocket) => {
    socket.on(CLIENT_EVENT_SEND_MESSAGE, async (payload, ack) => {
        await handleSendMessage(io, socket, payload, ack);
    });

    socket.on(CLIENT_EVENT_MARK_AS_READ, async payload => {
        await handleMarkAsRead(socket, payload);
    });
};
