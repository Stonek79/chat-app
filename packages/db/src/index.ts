import { PrismaClient, Prisma } from '@prisma/client';

/**
 * Модуль для инициализации и экспорта клиента Prisma.
 * Обеспечивает единую точку доступа к Prisma Client в приложении,
 * а также оптимизирует его использование в среде разработки (предотвращает создание множества инстансов).
 */

const prismaClientSingleton = () => {
    return new PrismaClient();
};

declare global {
    var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

export const prisma = globalThis.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma;

// Экспорт типов и энумов из Prisma для использования в других пакетах
export { Prisma };
export type {
    User,
    Chat,
    ChatParticipant,
    Message,
    MessageReadReceipt,
    MessageAction,
} from '@prisma/client';

// ТИПЫ СООБЩЕНИЙ - автоматически генерируются из Prisma схемы
export type MessageWithRelations = Prisma.MessageGetPayload<{
    include: {
        sender: true;
        readReceipts: {
            include: {
                user: true;
            };
        };
        actions: {
            include: {
                actor: true;
            };
        };
        replyTo: {
            include: {
                sender: true;
            };
        };
    };
}>;

export type MessageMinimal = Prisma.MessageGetPayload<{
    include: {
        sender: true;
    };
}>;

// ТИПЫ ЧАТОВ - автоматически генерируются из Prisma схемы
export type ChatWithParticipants = Prisma.ChatGetPayload<{
    include: {
        participants: {
            include: {
                user: true;
            };
        };
        _count: {
            select: {
                participants: true;
            };
        };
    };
}>;

export type ChatWithDetails = Prisma.ChatGetPayload<{
    include: {
        participants: {
            include: {
                user: true;
            };
        };
        messages: {
            include: {
                sender: true;
                readReceipts: {
                    include: {
                        user: true;
                    };
                };
                actions: {
                    include: {
                        actor: true;
                    };
                };
            };
        };
        _count: {
            select: {
                participants: true;
                messages: true;
            };
        };
    };
}>;

export type ChatForList = Prisma.ChatGetPayload<{
    include: {
        participants: true;
        _count: {
            select: {
                participants: true;
            };
        };
    };
}>;

// ТИПЫ УЧАСТНИКОВ ЧАТА
export type ChatParticipantWithUser = Prisma.ChatParticipantGetPayload<{
    include: {
        user: true;
    };
}>;

export type ChatParticipantWithPartialUser = Prisma.ChatParticipantGetPayload<{
    include: {
        user: {
            select: {
                id: true;
                username: true;
                email: true;
                avatarUrl: true;
                role: true;
            };
        };
    };
}>;

// Экспорт энумов из Prisma
export { UserRole, ChatParticipantRole, MessageContentType, ActionType } from '@prisma/client';
