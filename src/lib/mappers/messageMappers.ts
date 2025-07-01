import type { DisplayMessage, Message, SocketMessagePayload } from '@/types';

/**
 * @description Преобразует объект сообщения Prisma в формат DisplayMessage, подходящий для клиента.
 * @param {Message} message - Объект сообщения из Prisma, включающий sender, actions и readReceipts.
 * @param {string} currentUserId - ID текущего пользователя для определения 'isCurrentUser'.
 * @returns {DisplayMessage} Клиентский безопасный объект сообщения.
 */
export const mapPrismaMessageToDisplayMessage = (
    message: Message,
    currentUserId: string
): DisplayMessage => {
    // Сообщение считается отредактированным, если updatedAt > createdAt
    // и разница между ними больше нескольких секунд, чтобы избежать ложных срабатываний при создании
    const isEdited =
        !!message.updatedAt &&
        new Date(message.updatedAt).getTime() - new Date(message.createdAt).getTime() > 1000;

    return {
        id: message.id,
        content: message.content,
        contentType: message.contentType,
        mediaUrl: message.mediaUrl,
        createdAt: message.createdAt,
        updatedAt: message.updatedAt,
        chatId: message.chatId,
        sender: {
            id: message.sender.id,
            username: message.sender.username,
            avatarUrl: message.sender.avatarUrl,
            email: message.sender.email,
            role: message.sender.role,
        },
        actions: message.actions?.map(action => ({
            id: action.id,
            type: action.type,
            createdAt: action.createdAt,
            actor: action.actor,
        })),
        readReceipts: message.readReceipts?.map(receipt => ({
            userId: receipt.userId,
            readAt: receipt.readAt,
        })),
        isCurrentUser: message.sender.id === currentUserId,
        isEdited,
    };
};

/**
 * @description Преобразует SocketMessagePayload в формат DisplayMessage.
 * @param {SocketMessagePayload} socketMessage - Сообщение, полученное через WebSocket.
 * @param {string} currentUserId - ID текущего пользователя для определения 'isCurrentUser'.
 * @returns {DisplayMessage} Клиентский безопасный объект сообщения.
 */
export const mapSocketMessageToDisplayMessage = (
    socketMessage: SocketMessagePayload,
    currentUserId: string
): DisplayMessage => {
    const isEdited =
        !!socketMessage.updatedAt &&
        new Date(socketMessage.updatedAt).getTime() - new Date(socketMessage.createdAt).getTime() >
            1000;

    return {
        id: socketMessage.id,
        content: socketMessage.content,
        contentType: socketMessage.contentType,
        mediaUrl: null, // SocketMessagePayload не содержит mediaUrl
        createdAt: socketMessage.createdAt,
        updatedAt: socketMessage.updatedAt,
        chatId: socketMessage.chatId,
        sender: socketMessage.sender,
        actions: socketMessage.actions || [],
        readReceipts:
            socketMessage.readReceipts?.map(receipt => ({
                userId: receipt.userId,
                readAt: receipt.readAt,
            })) || [],
        isCurrentUser: socketMessage.sender.id === currentUserId,
        isEdited,
    };
};
