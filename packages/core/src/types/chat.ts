import { z } from 'zod';
import type { Chat, ChatParticipant, User } from '@chat-app/db';
import type { PrismaMessageWithRelations } from './message';
import {
    createChatSchema,
    updateChatSchema,
    addParticipantSchema,
    removeParticipantSchema,
    updateParticipantRoleSchema,
    clientChatSchema,
    chatWithDetailsSchema,
    chatListItemSchema,
    chatParticipantInfoSchema,
} from '../schemas/chat';

// ОСНОВНЫЕ ТИПЫ (выведены из Zod схем - единый источник истины)
export type CreateChatPayload = z.infer<typeof createChatSchema>;
export type UpdateChatPayload = z.infer<typeof updateChatSchema>;
export type AddParticipantPayload = z.infer<typeof addParticipantSchema>;
export type RemoveParticipantPayload = z.infer<typeof removeParticipantSchema>;
export type UpdateParticipantRolePayload = z.infer<typeof updateParticipantRoleSchema>;

// UI ТИПЫ (выведены из схем)
export type ClientChat = z.infer<typeof clientChatSchema>;
export type ChatWithDetails = z.infer<typeof chatWithDetailsSchema>;
export type ChatListItem = z.infer<typeof chatListItemSchema>;
export type ChatParticipantInfo = z.infer<typeof chatParticipantInfoSchema>;

// ТИПЫ ДЛЯ БД (используем автоматически генерируемые из Prisma)
export type PrismaChat = Chat;
export type PrismaChatParticipant = ChatParticipant;

// ТИПЫ ДЛЯ МАППЕРОВ (четкие интерфейсы вместо сложных пересечений)
// Обновлены для соответствия новой Prisma схеме
export type ChatParticipantWithUser = ChatParticipant & { user: User };

export type ChatParticipantWithPartialUser = ChatParticipant & {
    user: Pick<User, 'id' | 'username' | 'email' | 'avatarUrl' | 'role'>;
};

export type PrismaChatWithParticipants = Chat & {
    participants: ChatParticipantWithUser[];
    _count?: {
        participants?: number;
        messages?: number;
    };
};

export type PrismaChatWithPartialParticipants = Chat & {
    participants: ChatParticipantWithPartialUser[];
    _count?: {
        participants?: number;
        messages?: number;
    };
};

export type PrismaChatForList = Chat & {
    participants: ChatParticipantWithPartialUser[];
    messages: PrismaMessageWithRelations[];
    _count: {
        messages: number;
    };
};

// Тип для API route /api/chats с сообщениями и подсчетом непрочитанных
export type PrismaChatWithMessagesAndCount = Chat & {
    participants: ChatParticipantWithPartialUser[];
    messages: PrismaMessageWithRelations[];
    _count: {
        messages: number;
        participants?: number;
    };
};

// Тип для детальной информации о чате
export type PrismaDataForChatDetails = Chat & {
    participants: ChatParticipantWithUser[];
    messages: PrismaMessageWithRelations[];
    _count: {
        participants?: number;
        messages: number;
    };
};
