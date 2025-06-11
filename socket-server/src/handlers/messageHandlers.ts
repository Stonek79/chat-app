import {
    CHAT_NAMESPACE,
    CLIENT_EVENT_MARK_AS_READ,
    CLIENT_EVENT_SEND_MESSAGE,
    SERVER_EVENT_MESSAGES_READ,
    SERVER_EVENT_RECEIVE_MESSAGE,
} from '#/constants';
import { sendMessageSocketSchema } from '#/schemas';
import type {
    AppIoServer,
    AppServerSocket,
    ClientSendMessagePayload,
    SocketMessagePayload,
} from '#/types';

import { prisma } from '../lib';

async function handleSendMessage(
    io: AppIoServer,
    socket: AppServerSocket,
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

        const validationResult = sendMessageSocketSchema.safeParse(payload);
        if (!validationResult.success) {
            // Преобразуем ошибки Zod в строку
            const errorMessage = JSON.stringify(validationResult.error.flatten().fieldErrors);
            throw new Error(`Ошибка валидации: ${errorMessage}`);
        }
        const { chatId, content, contentType = 'TEXT', clientTempId } = validationResult.data;

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
                },
                include: {
                    sender: {
                        select: {
                            id: true,
                            username: true,
                            email: true,
                            avatarUrl: true,
                            role: true,
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

        const messagePayload: SocketMessagePayload = {
            id: newMessage.id,
            chatId: newMessage.chatId,
            content: newMessage.content,
            contentType: newMessage.contentType,
            createdAt: newMessage.createdAt,
            updatedAt: newMessage.updatedAt,
            sender: {
                id: newMessage.sender.id,
                username: newMessage.sender.username,
                avatarUrl: newMessage.sender.avatarUrl,
                role: newMessage.sender.role,
                email: newMessage.sender.email,
            },
            readReceipts: [],
            actions: [],
            clientTempId,
        };

        io.of(CHAT_NAMESPACE).to(chatId).emit(SERVER_EVENT_RECEIVE_MESSAGE, messagePayload);
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

async function handleMarkAsRead(
    io: AppIoServer,
    socket: AppServerSocket,
    payload: { chatId: string; lastReadMessageId: string }
) {
    const user = socket.data.user;
    if (!user || !user.userId) {
        console.warn(`[Messages] Unauthorized attempt to mark messages as read.`);
        return;
    }

    const { chatId, lastReadMessageId } = payload;
    const currentReadTime = new Date();

    try {
        const potentialMessages = await prisma.message.findMany({
            where: {
                chatId: chatId,
                id: { lte: lastReadMessageId },
                senderId: { not: user.userId },
            },
            select: { id: true },
        });

        if (potentialMessages.length === 0) {
            return;
        }

        const potentialMessageIds = potentialMessages.map(m => m.id);

        const alreadyReadReceipts = await prisma.messageReadReceipt.findMany({
            where: {
                userId: user.userId,
                messageId: { in: potentialMessageIds },
            },
            select: { messageId: true },
        });

        const alreadyReadMessageIds = new Set(alreadyReadReceipts.map(r => r.messageId));
        const messageIdsToMarkAsRead = potentialMessageIds.filter(
            id => !alreadyReadMessageIds.has(id)
        );

        if (messageIdsToMarkAsRead.length === 0) {
            return;
        }

        await prisma.messageReadReceipt.createMany({
            data: messageIdsToMarkAsRead.map(messageId => ({
                messageId: messageId,
                userId: user.userId,
                readAt: currentReadTime,
            })),
            skipDuplicates: true,
        });

        console.log(
            `[Messages] User ${user.userId} marked ${messageIdsToMarkAsRead.length} messages as read in chat ${chatId}.`
        );

        io.of(CHAT_NAMESPACE).to(chatId).emit(SERVER_EVENT_MESSAGES_READ, {
            chatId: chatId,
            userId: user.userId,
            lastReadMessageId: lastReadMessageId,
            readAt: currentReadTime,
        });
    } catch (error) {
        console.error(`[Messages] Error marking messages as read for user ${user.userId}:`, error);
    }
}

export const registerMessageHandlers = (io: AppIoServer, socket: AppServerSocket) => {
    socket.on(CLIENT_EVENT_SEND_MESSAGE, (payload, ack) =>
        handleSendMessage(io, socket, payload, ack)
    );
    socket.on(CLIENT_EVENT_MARK_AS_READ, payload => handleMarkAsRead(io, socket, payload));
};
