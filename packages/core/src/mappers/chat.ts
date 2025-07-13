import type {
    ClientChat,
    ChatParticipantInfo,
    ChatWithDetails,
    PrismaChatWithPartialParticipants,
    ChatParticipantWithUser,
    ChatParticipantWithPartialUser,
    PrismaChatWithMessagesAndCount,
    PrismaDataForChatDetails,
    PrismaChatForList,
} from '../types/chat';
import type { DisplayMessage } from '../types/message';
import { toClientUser, createClientUserFromPartial } from './user';
import { DEFAULT_ROLES } from '../constants/validation';
import { toDisplayMessage } from './message';

/**
 * Определяет, является ли чат активным для пользователя
 */
function isChatActiveForUser(members: ChatParticipantInfo[], currentUserId: string): boolean {
    const currentUserParticipant = members.find(p => p.userId === currentUserId);

    // Пользователь не является участником чата
    if (!currentUserParticipant) {
        return false;
    }

    // Пользователь покинул чат
    if (currentUserParticipant.leftAt) {
        return false;
    }

    // Проверяем, есть ли активные участники (не покинувшие чат)
    const activeMembers = members.filter(p => !p.leftAt);

    // Чат активен если есть хотя бы 1 активный участник
    return activeMembers.length > 0;
}

/**
 * Преобразует Prisma ChatParticipant в ChatParticipantInfo (убирает encryptedSessionKey)
 * Приватная функция - используется только внутри других мапперов
 */
function toChatParticipantInfo(prismaParticipant: ChatParticipantWithUser): ChatParticipantInfo {
    const { encryptedSessionKey, user, ...participantInfo } = prismaParticipant;

    // Удаляем приватное поле encryptedSessionKey
    void encryptedSessionKey;

    return {
        ...participantInfo,
        user: toClientUser(user),
    };
}

/**
 * Преобразует ChatParticipant с частичными User данными в ChatParticipantInfo
 * Экспортируется для использования в API routes
 */
export function toChatParticipantInfoFromPartial(
    prismaParticipant: ChatParticipantWithPartialUser
): ChatParticipantInfo {
    const { encryptedSessionKey, user, ...participantInfo } = prismaParticipant;

    // Удаляем приватное поле encryptedSessionKey
    void encryptedSessionKey;

    const clientUser = createClientUserFromPartial({
        id: user.id,
        username: user.username,
        email: user.email,
        avatarUrl: user.avatarUrl,
        role: user.role,
    });

    return {
        ...participantInfo,
        user: clientUser,
    };
}

/**
 * Преобразует Prisma Chat в ClientChat
 * Упрощенная версия для API routes с полными данными
 */
export function toClientChat(
    prismaChat: PrismaChatWithMessagesAndCount,
    currentUserId: string
): ClientChat {
    const members = prismaChat.participants.map((p: ChatParticipantWithPartialUser) =>
        toChatParticipantInfoFromPartial(p)
    );
    const messages = prismaChat.messages.map(m => toDisplayMessage(m, currentUserId));
    const lastMessage = messages[0];
    const unreadCount = prismaChat._count?.messages ?? 0;

    console.log('TO CLIENT CHAT', messages);

    return {
        id: prismaChat.id,
        name: prismaChat.name,
        isGroupChat: prismaChat.isGroupChat,
        avatarUrl: prismaChat.avatarUrl,
        createdAt: prismaChat.createdAt,
        updatedAt: prismaChat.updatedAt,
        members,
        messages,
        lastMessage,
        unreadCount,
    };
}

/**
 * Создает ClientChat вручную с переданными параметрами
 * Используется когда нет полных данных сообщений из Prisma
 */
export function toClientChatManual(
    prismaChat: PrismaChatWithPartialParticipants,
    members: ChatParticipantInfo[],
    messages: DisplayMessage[] = [],
    lastMessage?: DisplayMessage,
    unreadCount = 0
): ClientChat {
    return {
        id: prismaChat.id,
        name: prismaChat.name,
        isGroupChat: prismaChat.isGroupChat,
        avatarUrl: prismaChat.avatarUrl,
        createdAt: prismaChat.createdAt,
        updatedAt: prismaChat.updatedAt,
        members,
        messages,
        lastMessage: lastMessage ?? null,
        unreadCount,
    };
}

/**
 * Создает ChatWithDetails с участниками и дополнительной информацией
 */
export function toChatWithDetails(
    prismaChat: PrismaDataForChatDetails,
    currentUserId: string
): ChatWithDetails {
    const members = prismaChat.participants.map(p => toChatParticipantInfo(p));
    const currentUserParticipant = members.find(p => p.userId === currentUserId);

    if (!currentUserParticipant) {
        throw new Error(
            `Пользователь ${currentUserId} не является участником чата ${prismaChat.id}`
        );
    }

    const messages = prismaChat.messages.map(m => toDisplayMessage(m, currentUserId));
    const lastMessage = messages.length > 0 ? messages[0] : undefined;
    const unreadCount = prismaChat._count?.messages ?? 0;

    const participantCount = prismaChat._count?.participants ?? prismaChat.participants.length;
    const canEdit =
        currentUserParticipant.role === DEFAULT_ROLES.OWNER ||
        currentUserParticipant.role === DEFAULT_ROLES.ADMIN;
    const canDelete = currentUserParticipant.role === DEFAULT_ROLES.OWNER;
    const canAddMembers =
        currentUserParticipant.role === DEFAULT_ROLES.OWNER ||
        currentUserParticipant.role === DEFAULT_ROLES.ADMIN;
    const canRemoveMembers =
        currentUserParticipant.role === DEFAULT_ROLES.OWNER ||
        currentUserParticipant.role === DEFAULT_ROLES.ADMIN;

    return {
        id: prismaChat.id,
        name: prismaChat.name,
        isGroupChat: prismaChat.isGroupChat,
        avatarUrl: prismaChat.avatarUrl,
        createdAt: prismaChat.createdAt,
        updatedAt: prismaChat.updatedAt,
        members,
        messages,
        lastMessage,
        unreadCount,
        participantCount,
        isActive: isChatActiveForUser(members, currentUserId),
        canEdit,
        canDelete,
        canAddMembers,
        canRemoveMembers,
    };
}

/**
 * Создает ChatWithDetails из частичных User данных (для API с select)
 */
export function toChatWithDetailsFromPartial(
    prismaChat: PrismaChatWithPartialParticipants,
    currentUserId: string,
    lastMessage?: DisplayMessage,
    unreadCount = 0
): ChatWithDetails {
    const members = prismaChat.participants.map(p => toChatParticipantInfoFromPartial(p));
    const currentUserParticipant = members.find(p => p.userId === currentUserId);

    if (!currentUserParticipant) {
        throw new Error(
            `Пользователь ${currentUserId} не является участником чата ${prismaChat.id}`
        );
    }

    const clientChat = toClientChatManual(
        prismaChat,
        members,
        [], // messages будут пустыми
        lastMessage,
        unreadCount
    );

    const participantCount = prismaChat._count?.participants ?? prismaChat.participants.length;
    const canEdit =
        currentUserParticipant.role === DEFAULT_ROLES.OWNER ||
        currentUserParticipant.role === DEFAULT_ROLES.ADMIN;
    const canDelete = currentUserParticipant.role === DEFAULT_ROLES.OWNER;
    const canAddMembers =
        currentUserParticipant.role === DEFAULT_ROLES.OWNER ||
        currentUserParticipant.role === DEFAULT_ROLES.ADMIN;
    const canRemoveMembers =
        currentUserParticipant.role === DEFAULT_ROLES.OWNER ||
        currentUserParticipant.role === DEFAULT_ROLES.ADMIN;

    return {
        ...clientChat,
        participantCount,
        isActive: isChatActiveForUser(members, currentUserId),
        canEdit,
        canDelete,
        canAddMembers,
        canRemoveMembers,
    };
}

/**
 * Преобразует Prisma Chat в ChatWithDetails для списка чатов.
 * Легковесная версия, использующая данные, оптимизированные для списка.
 */
export function toChatListItem(
    prismaChat: PrismaChatForList,
    currentUserId: string
): ChatWithDetails {
    const members = prismaChat.participants.map(p => toChatParticipantInfoFromPartial(p));

    const lastPrismaMessage = prismaChat.messages[0];
    const lastMessage = lastPrismaMessage
        ? toDisplayMessage(lastPrismaMessage, currentUserId)
        : undefined;

    const unreadCount = prismaChat._count?.messages ?? 0;

    const currentUserParticipant = members.find(p => p.userId === currentUserId);
    const canEdit =
        !!currentUserParticipant &&
        (currentUserParticipant.role === DEFAULT_ROLES.OWNER ||
            currentUserParticipant.role === DEFAULT_ROLES.ADMIN);
    const canDelete =
        !!currentUserParticipant && currentUserParticipant.role === DEFAULT_ROLES.OWNER;

    return {
        id: prismaChat.id,
        name: prismaChat.name,
        isGroupChat: prismaChat.isGroupChat,
        avatarUrl: prismaChat.avatarUrl,
        createdAt: prismaChat.createdAt,
        updatedAt: prismaChat.updatedAt,
        members,
        messages: lastMessage ? [lastMessage] : [], // В списке нам не нужен полный массив сообщений
        lastMessage,
        unreadCount,
        participantCount: prismaChat.participants.length,
        isActive: isChatActiveForUser(members, currentUserId),
        canEdit,
        canDelete,
        canAddMembers: canEdit,
        canRemoveMembers: canEdit,
    };
}
