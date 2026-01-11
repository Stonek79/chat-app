import { NextRequest, NextResponse } from 'next/server';
import {
    editMessageSchema,
    MESSAGE_DELETION_WINDOW_MINUTES,
    REDIS_EVENT_MESSAGE_DELETED,
    REDIS_EVENT_MESSAGE_EDITED,
    REDIS_SOCKET_NOTIFICATIONS_CHANNEL,
    toDisplayMessage,
} from '@chat-app/core';
import { ChatParticipantRole, ActionType, UserRole } from '@chat-app/db';
import { getCurrentUser, prisma } from '@/lib';
import { publishNotification } from '@chat-app/server-shared';
import { deleteFile } from '@chat-app/media-storage';

/**
 * DELETE /api/messages/[messageId]
 * Необратимо удаляет сообщение (Hard Delete).
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
            },
        });

        if (!message) {
            return NextResponse.json({ error: 'Message not found' }, { status: 404 });
        }

        // 2. Проверить права на удаление
        const userParticipant = message.chat.participants.find(p => p.userId === currentUserId);
        const isAdminOrOwner =
            currentUser.role === UserRole.ADMIN ||
            userParticipant?.role === ChatParticipantRole.ADMIN ||
            userParticipant?.role === ChatParticipantRole.OWNER;

        const isAuthor = message.senderId === currentUserId;

        // Удалять может либо автор своего сообщения, либо админ/владелец чата или системы
        const canDelete = isAuthor || isAdminOrOwner;

        if (!canDelete) {
            return NextResponse.json(
                { error: 'You do not have permission to delete this message' },
                { status: 403 }
            );
        }

        // 3. Атомарная транзакция для удаления
        await prisma.$transaction(async tx => {
            // 3.1. Обнулить ссылки на это сообщение у других сообщений
            await tx.message.deleteMany({
                where: { replyTo: { id: messageId } },
            });

            // 3.2. Физически удалить связанные файлы (если есть)
            if (message.mediaUrl) {
                // `deleteFile` должна обработать ошибку, если файл не найден,
                // но прервать транзакцию, если удаление не удалось по другой причине.
                await deleteFile(message.mediaUrl);
            }

            // 3.3. Физически удалить сообщение
            await tx.message.delete({
                where: { id: messageId },
            });
        });

        // 4. Оповестить socket-server через Redis
        const notificationPayload = {
            type: REDIS_EVENT_MESSAGE_DELETED,
            data: {
                chatId: message.chatId,
                messageId: message.id,
            },
        };
        await publishNotification(REDIS_SOCKET_NOTIFICATIONS_CHANNEL, notificationPayload);

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error('Error deleting message:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

/**
 * PATCH /api/messages/[messageId]
 * Редактирует существующее сообщение.
 */
export async function PATCH(req: NextRequest, { params }: { params: { messageId: string } }) {
    try {
        const currentUser = await getCurrentUser(req);
        if (!currentUser?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { messageId } = await params;
        if (!messageId) {
            return NextResponse.json({ error: 'Message ID is required' }, { status: 400 });
        }

        const body = await req.json();
        const dataToValidate = {
            ...body,
            messageId,
        };
        
        const validationResult = editMessageSchema.safeParse(dataToValidate);
        
        if (!validationResult.success) {
            return NextResponse.json(
                { error: 'Invalid data', details: validationResult.error },
                { status: 400 }
            );
        }

        const { content, mediaUrl, contentType } = validationResult.data;
        const currentUserId = currentUser.id;

        // 1. Найти сообщение для проверки прав
        const message = await prisma.message.findUnique({
            where: { id: messageId },
        });

        if (!message) {
            return NextResponse.json({ error: 'Message not found' }, { status: 404 });
        }

        // 2. Проверить права на редактирование
        const isAuthor = message.senderId === currentUserId;
        const isTimeWindowOk =
            (new Date().getTime() - new Date(message.createdAt).getTime()) / (1000 * 60) <
            MESSAGE_DELETION_WINDOW_MINUTES;

        const isAdmin = currentUser.role === 'ADMIN';

        // Только автор может редактировать (в пределах окна) или Админ (всегда)
        const canEdit = isAdmin || (isAuthor && isTimeWindowOk);

        if (!canEdit) {
            return NextResponse.json(
                { error: 'You do not have permission to edit this message' },
                { status: 403 }
            );
        }

        // 3. Создать запись о действии "редактирование"
        const { updatedMessage } = await prisma.$transaction(async tx => {
            // 3.1. Создаем запись о действии "редактирование"
            const action = await tx.messageAction.create({
                data: {
                    type: ActionType.EDITED,
                    messageId: messageId,
                    actorId: currentUserId,
                    newContent: content,
                },
                include: { actor: true },
            });
            
            // 3.2. Обновляем само сообщение, чтобы оно содержало актуальный контент
            const message = await tx.message.update({
                where: { id: messageId },
                data: {
                    content: content,
                    mediaUrl: mediaUrl,
                    contentType: contentType,
                    isEdited: true,
                },
                include: {
                    sender: true,
                    actions: {
                        include: { actor: true },
                        orderBy: { createdAt: 'desc' },
                    },
                    readReceipts: {
                        include: {
                            user: true,
                        },
                    },
                    replyTo: {
                        include: {
                            sender: true,
                        },
                    },
                },
            });            

            return { updatedMessage: message, editAction: action };
        });

        // 4. Формируем и отправляем уведомление
        const displayMessage = toDisplayMessage(updatedMessage, currentUserId);

        const notificationPayload = {
            type: REDIS_EVENT_MESSAGE_EDITED,
            data: displayMessage, // Отправляем полный обновленный объект
        };

        await publishNotification(REDIS_SOCKET_NOTIFICATIONS_CHANNEL, notificationPayload);

        return NextResponse.json(displayMessage, { status: 200 });
    } catch (error) {
        console.error('Error editing message:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
