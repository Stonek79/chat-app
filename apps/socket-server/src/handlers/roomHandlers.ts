import {
    CLIENT_EVENT_JOIN_CHAT,
    CLIENT_EVENT_LEAVE_CHAT,
    SERVER_EVENT_USER_JOINED,
    SERVER_EVENT_USER_LEFT,
} from '@chat-app/socket-shared';
import type { AppSocket } from '@chat-app/socket-shared';
import { prisma } from '@chat-app/db';

async function handleJoinChat(socket: AppSocket, chatId: string) {
    const user = socket.data.user;
    if (!user) {
        socket.emit('error', {
            message: 'Authentication required to join chat.',
            code: 'UNAUTHORIZED',
        });
        return;
    }

    try {
        const participant = await prisma.chatParticipant.findFirst({
            where: {
                userId: user.userId,
                chatId: chatId,
            },
        });

        if (!participant) {
            console.warn(
                `[Rooms] User ${user.userId} failed to join chat ${chatId}: not a participant.`
            );
            socket.emit('error', {
                message: 'You are not a member of this chat.',
                code: 'FORBIDDEN',
            });
            return;
        }

        await socket.join(chatId);
        console.log(`[Rooms] User ${user.username} (${socket.id}) joined room: ${chatId}`);

        const presencePayload = {
            chatId,
            userId: user.userId,
            email: user.email!,
            role: participant.role,
            username: user.username!,
            avatarUrl: user.avatarUrl || '',
        };
        // Уведомляем остальных в комнате, что пользователь присоединился
        socket.to(chatId).emit(SERVER_EVENT_USER_JOINED, presencePayload);
    } catch (error) {
        console.error(
            `[Rooms] Error during JOIN_CHAT for user ${user.userId} in chat ${chatId}:`,
            error
        );
        socket.emit('error', {
            message: 'An internal error occurred.',
            code: 'INTERNAL_ERROR',
        });
    }
}

async function handleLeaveChat(socket: AppSocket, chatId: string) {
    const user = socket.data.user;
    if (!user) {
        console.warn(`[Rooms] Anonymous user ${socket.id} attempted to leave room ${chatId}`);
        return;
    }

    try {
        // Убедимся, что пользователь был участником, чтобы получить его роль
        const participant = await prisma.chatParticipant.findFirst({
            where: {
                userId: user.userId,
                chatId: chatId,
            },
            select: { role: true },
        });

        await socket.leave(chatId);
        console.log(`[Rooms] User ${user.username} (${socket.id}) left room: ${chatId}`);

        if (participant) {
            const presencePayload = {
                chatId,
                userId: user.userId,
                email: user.email!,
                role: participant.role,
                username: user.username!,
                avatarUrl: user.avatarUrl || '',
            };
            // Уведомляем остальных в комнате, что пользователь вышел
            socket.to(chatId).emit(SERVER_EVENT_USER_LEFT, presencePayload);
        }
    } catch (error) {
        console.error(
            `[Rooms] Error during LEAVE_CHAT for user ${user.userId} in chat ${chatId}:`,
            error
        );
    }
}

export const registerRoomHandlers = (socket: AppSocket) => {
    socket.on(CLIENT_EVENT_JOIN_CHAT, (chatId: string) => handleJoinChat(socket, chatId));
    socket.on(CLIENT_EVENT_LEAVE_CHAT, (chatId: string) => handleLeaveChat(socket, chatId));
};
