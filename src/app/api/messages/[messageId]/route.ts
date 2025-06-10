import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, prisma, getRedisPublisher } from '@/lib';
import { UserRoleEnum, ChatParticipantRoleEnum, MessageActionTypeEnum } from '@/constants';

const MESSAGE_DELETION_WINDOW_MINUTES = 15;

/**
 * DELETE /api/messages/[messageId]
 * Создает запись о "мягком" удалении сообщения
 */
export async function DELETE(req: NextRequest, { params }: { params: { messageId: string } }) {
    try {
        const currentUser = await getCurrentUser(req);
        if (!currentUser?.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { messageId } = await params;
        if (!messageId) {
            return NextResponse.json({ error: 'Message ID is required' }, { status: 400 });
        }

        const currentUserId = currentUser.userId;

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
                    where: { type: MessageActionTypeEnum.DELETED },
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
        const isAdmin = currentUser.role === UserRoleEnum.ADMIN;
        const isChatOwner = userParticipant.role === ChatParticipantRoleEnum.OWNER;
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
                type: MessageActionTypeEnum.DELETED,
                messageId: messageId,
                actorId: currentUserId,
            },
            include: {
                actor: {
                    select: {
                        id: true,
                        username: true,
                    },
                },
            },
        });

        // 4. Оповестить socket-server через Redis
        const redisPublisher = await getRedisPublisher();
        if (redisPublisher) {
            const notificationPayload = {
                type: 'MESSAGE_DELETED',
                data: {
                    chatId: message.chatId,
                    messageId: message.id,
                    action: {
                        id: deleteAction.id,
                        type: deleteAction.type,
                        actor: deleteAction.actor,
                        createdAt: deleteAction.createdAt,
                    },
                },
            };
            await redisPublisher.publish(
                process.env.REDIS_SOCKET_NOTIFICATIONS_CHANNEL!,
                JSON.stringify(notificationPayload)
            );
        }

        return NextResponse.json(deleteAction, { status: 200 });
    } catch (error) {
        console.error('Error deleting message:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
