import type {
    PrismaMessageForDisplay,
    DisplayMessage,
    MessagePayload,
    MessageActionWithActor,
    ClientMessageAction,
} from '../types/message';
import { toClientUser } from './user';

/**
 * Создает DisplayMessage с полной информацией для UI
 */
export function toDisplayMessage(
    prismaMessage: PrismaMessageForDisplay,
    currentUserId: string,
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

    return {
        id: prismaMessage.id,
        chatId: prismaMessage.chatId,
        senderId: prismaMessage.senderId,
        content: prismaMessage.content,
        mediaUrl: prismaMessage.mediaUrl,
        contentType: prismaMessage.contentType,
        createdAt: prismaMessage.createdAt,
        updatedAt: prismaMessage.updatedAt,
        isEdited: prismaMessage.isEdited,
        isPinned: prismaMessage.isPinned, // Теперь это поле будет доступно
        status: prismaMessage.status,
        replyToMessageId: prismaMessage.replyToMessageId,
        forwardedFromMessageId: prismaMessage.forwardedFromMessageId,
        sender,
        readReceipts,
        actions,
        replyTo,
        isCurrentUser: prismaMessage.senderId === currentUserId,
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
        mediaUrl: null, // В payload нет mediaUrl
        contentType: payload.contentType,
        createdAt: payload.createdAt,
        updatedAt: payload.updatedAt,
        isEdited: false, // Новое сообщение не может быть отредактировано
        isPinned: false, // Новое сообщение не может быть закреплено
        status: 'SENT', 
        replyToMessageId: null, 
        forwardedFromMessageId: null, 
        sender: payload.sender,
        readReceipts: payload.readReceipts || [],
        actions: payload.actions || [],
        replyTo: undefined,
        isCurrentUser,
    };
}

export function toClientMessageAction(action: MessageActionWithActor): ClientMessageAction {
    // Prisma возвращает User, а нужен ClientUser
    const clientActor = toClientUser(action.actor);

    return {
        id: action.id,
        type: action.type,
        messageId: action.messageId,
        actorId: action.actorId,
        actor: clientActor,
        createdAt: action.createdAt,
        newContent: action.newContent || null,
    };
}
