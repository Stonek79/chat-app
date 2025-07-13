import { UserRole } from '@chat-app/db';
import type { PrismaMessageForDisplay, DisplayMessage, MessagePayload } from '../types/message';
import { toClientUser } from './user';

/**
 * Создает DisplayMessage с полной информацией для UI
 */
export function toDisplayMessage(
    prismaMessage: PrismaMessageForDisplay,
    currentUserId: string
): DisplayMessage {
    const sender = toClientUser(prismaMessage.sender);
    const readReceipts = (prismaMessage.readReceipts || []).map(receipt => ({
        ...receipt,
        user: toClientUser(receipt.user),
    }));

    const actions = (prismaMessage.actions || []).map(action => ({
        ...action,
        actor: toClientUser(action.actor),
    }));

    const replyTo = prismaMessage.replyTo
        ? {
              id: prismaMessage.replyTo.id,
              content: prismaMessage.replyTo.content,
              sender: toClientUser(prismaMessage.replyTo.sender),
              contentType: prismaMessage.replyTo.contentType,
          }
        : undefined;

    const isCurrentUser = prismaMessage.senderId === currentUserId;

    return {
        ...prismaMessage,
        sender,
        readReceipts,
        actions,
        replyTo,
        isCurrentUser,
        canEdit: isCurrentUser && !prismaMessage.deletedAt,
        canDelete: isCurrentUser,
    };
}

// Функция преобразования MessagePayload -> DisplayMessage
export function convertMessagePayloadToDisplayMessage(
    payload: MessagePayload,
    currentUserId: string
): DisplayMessage {
    const isCurrentUser = payload.sender.id === currentUserId;

    return {
        id: payload.id,
        chatId: payload.chatId,
        senderId: payload.sender.id,
        content: payload.content,
        mediaUrl: null,
        contentType: payload.contentType,
        createdAt: payload.createdAt,
        updatedAt: payload.updatedAt,
        deletedAt: null, // MessagePayload не содержит deletedAt
        isEdited: false, // MessagePayload не содержит isEdited
        status: 'SENT', // Значение по умолчанию
        replyToMessageId: null, // MessagePayload не содержит replyToMessageId
        forwardedFromMessageId: null, // MessagePayload не содержит forwardedFromMessageId
        sender: payload.sender,
        readReceipts: payload.readReceipts || [],
        actions: payload.actions || [],
        replyTo: undefined,
        isCurrentUser,
        canEdit: isCurrentUser,
        canDelete: isCurrentUser,
    };
}
