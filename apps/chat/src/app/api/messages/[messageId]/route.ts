import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import type { ClientMessageAction } from '@chat-app/core';
import { REDIS_EVENT_MESSAGE_DELETED } from '@chat-app/core';
import { ChatParticipantRole, ActionType, UserRole } from '@chat-app/db';

import { getCurrentUser, prisma } from '@/lib';

const MESSAGE_DELETION_WINDOW_MINUTES = 15;

/**
 * DELETE /api/messages/[messageId]
 * Создает запись о "мягком" удалении сообщения
 */
export async function DELETE(req: NextRequest, { params }: { params: { messageId: string } }) {
    try {
        const currentUser = await getCurrentUser(req);
        if (!currentUser?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { messageId } = await params;
        if (!messageId) {
            return NextResponse.json({ error: 'Message ID is required' }, { status: 400 });
        }

        const currentUserId = currentUser.id;

        // 1. Найти сообщение и связанную информацию для проверки прав
        const message = await prisma.message.findUnique({
            where: { id: messageId },
            include: {
                chat: {
                    include: {
                        participants: true,
                    },
                },
                actions: {
                    where: { type: ActionType.DELETED },
                },
            },
        });

        if (!message) {
            return NextResponse.json({ error: 'Message not found' }, { status: 404 });
        }

        // Проверяем, не удалено ли уже
        if (message.actions.length > 0) {
            return NextResponse.json({ error: 'Message already deleted' }, { status: 400 });
        }

        // 2. Проверить права на удаление
        const userParticipant = message.chat.participants.find(p => p.userId === currentUserId);
        if (!userParticipant) {
            return NextResponse.json(
                { error: 'You are not a member of this chat' },
                { status: 403 }
            );
        }

        const isAuthor = message.senderId === currentUserId;
        const isAdmin = currentUser.role === UserRole.ADMIN;
        const isChatOwner = userParticipant.role === ChatParticipantRole.OWNER;
        const isTimeWindowOk =
            (new Date().getTime() - new Date(message.createdAt).getTime()) / (1000 * 60) <
            MESSAGE_DELETION_WINDOW_MINUTES;

        const canDelete = isAdmin || isChatOwner || (isAuthor && isTimeWindowOk);

        if (!canDelete) {
            return NextResponse.json(
                { error: 'You do not have permission to delete this message' },
                { status: 403 }
            );
        }

        // 3. Создать запись о действии "удаление"
        const deleteAction = await prisma.messageAction.create({
            data: {
                id: randomBytes(16).toString('hex'),
                type: ActionType.DELETED,
                messageId: messageId,
                actorId: currentUserId,
            },
            include: {
                actor: {
                    select: {
                        id: true,
                        username: true,
                        email: true,
                        avatarUrl: true,
                        role: true,
                    },
                },
            },
        });

        // 4. Оповестить socket-server через Redis
        // Убираем поля, которых нет в ClientMessageAction
        const clientAction: ClientMessageAction = {
            id: deleteAction.id,
            type: deleteAction.type,
            messageId: deleteAction.messageId,
            actorId: deleteAction.actorId,
            actor: deleteAction.actor,
            createdAt: deleteAction.createdAt,
            newContent: null,
        };

        const notificationPayload = {
            type: REDIS_EVENT_MESSAGE_DELETED,
            data: {
                chatId: message.chatId,
                messageId: message.id,
                action: clientAction,
            },
        };
        // await publishNotification(REDIS_SOCKET_NOTIFICATIONS_CHANNEL, notificationPayload);

        return NextResponse.json(deleteAction, { status: 200 });
    } catch (error) {
        console.error('Error deleting message:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
