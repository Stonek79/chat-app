import { BasicUser, DisplayMessage,Message } from '@/types';

/**
 * Расширенный тип для сообщения Prisma, включающий данные отправителя.
 */
type PrismaMessageWithSender = Message & { sender: BasicUser };

/**
 * @description Преобразует объект сообщения Prisma в формат DisplayMessage, подходящий для клиента.
 * @param {PrismaMessageWithSender} message - Объект сообщения из Prisma.
 * @returns {DisplayMessage} Клиентский безопасный объект сообщения.
 */
export const mapPrismaMessageToDisplayMessage = (
    message: PrismaMessageWithSender
): DisplayMessage => {
    return {
        id: message.id,
        content: message.content,
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
        read: false, // Это поле будет управляться на клиенте
    };
};
