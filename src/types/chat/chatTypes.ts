import { Message } from '../message';
import { ChatParticipantRole } from '@prisma/client';

export type {
    Chat,
    ChatParticipant as PrismaChatParticipant,
    ChatParticipantRole,
} from '@prisma/client';

// Краткая информация о пользователе для отображения в списках, сообщениях и т.д.
export interface ClientChatParticipant {
    id: string;
    username: string;
    avatarUrl?: string | null;
    role: ChatParticipantRole;
    email: string;

    // Можно добавить онлайн-статус, если он будет использоваться здесь
    // isOnline?: boolean;
}

// Информация о последнем сообщении в чате для превью
export interface ChatLastMessage {
    id: string;
    content: string;
    createdAt: Date;
    senderId: string;
    senderUsername: string;
    senderEmail: string;
}

// Основной тип для представления чата на клиенте
export interface ClientChat {
    id: string;
    name?: string | null; // Имя группового чата или вычисляемое имя для ЛС
    isGroupChat: boolean;
    members?: ClientChatParticipant[]; // Участники чата (может быть опционально для списков)
    lastMessage?: ChatLastMessage | null;
    unreadCount?: number; // Количество непрочитанных сообщений
    avatarUrl?: string | null; // Аватар для группового чата или собеседника в ЛС
    messages?: Message[];
    // Другие поля, которые могут понадобиться, например, typingIndicators
}

// Тип для сообщения в чате
export interface ChatMessage {
    id: string;
    chatId: string;
    sender: ClientChatParticipant;
    content: string;
    createdAt: Date;
    updatedAt?: Date | null;
    isOptimistic?: boolean; // Для UI, если сообщение еще не подтверждено сервером
    // Можно добавить реакции, статус прочтения и т.д.
}

// Пейлоад для создания нового личного чата
export interface CreateDirectChatPayload {
    targetUserId: string;
}

// Пейлоад для создания нового группового чата
export interface CreateGroupChatPayload {
    name: string;
    memberIds: string[]; // ID пользователей, добавляемых в группу (кроме создателя)
}
