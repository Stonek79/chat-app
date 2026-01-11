import { ChatParticipantInfo, ChatWithDetails, UI_MESSAGES, AuthenticatedUser } from '@chat-app/core';

export const formatLastSeen = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);

    if (minutes < 1) return 'только что';
    if (minutes < 60) return `${minutes} мин. назад`;
    if (hours < 24) return `${hours} ч. назад`;
    return date.toLocaleDateString();
};

export const getChatStatus = (
    details: ChatWithDetails | null,
    participants: ChatParticipantInfo[],
    currentUser: AuthenticatedUser | null,
    typingUsers: string[] = []
): string => {
    if (!details) return '';

    if (typingUsers.length > 0) {
        if (details.isGroupChat) {
             const count = typingUsers.length;
             return count > 1 ? `${count} печатают...` : `${typingUsers[0]} печатает...`;
        }
        // Private chat logic: if the other person is typing
        // We assume typingUsers contains usernames.
        // For private chat, simpler: "печатает..."
         return 'печатает...';
    }

    if (details.isGroupChat) {
        return `${participants.length} участника(ов)`;
    }

    // For 1-1 chat, find the other participant
    const otherParticipant = participants.find(p => p.userId !== currentUser?.id);
    if (!otherParticipant) return 'Неизвестно';

    if (otherParticipant.user.isOnline) {
        return 'В сети';
    }

    if (otherParticipant.user.lastSeenAt) {
        return `Был(а) ${formatLastSeen(new Date(otherParticipant.user.lastSeenAt))}`;
    }

    return 'Офлайн';
};

export const getChatHeaderInfo = (
    details: ChatWithDetails | null,
    participants: ChatParticipantInfo[],
    currentUser: AuthenticatedUser | null
): { name: string; avatarUrl: string | null; isOnline: boolean } => {
    if (!details) return { name: '', avatarUrl: '', isOnline: false };

    if (details.isGroupChat) {
        return {
            name: details.name || UI_MESSAGES.UNNAMED_CHAT,
            avatarUrl: details.avatarUrl || null,
            isOnline: false, // Групповой чат не имеет статуса онлайн
        };
    }

    // Для приватного чата находим собеседника
    const otherParticipant = participants.find(p => p.userId !== currentUser?.id);
    if (otherParticipant) {
        const name = otherParticipant.user.username || 'Пользователь';
        return {
            name,
            avatarUrl: otherParticipant.user.avatarUrl || null,
            isOnline: otherParticipant.user.isOnline,
        };
    }

    return {
        name: details.name || UI_MESSAGES.UNNAMED_CHAT,
        avatarUrl: details.avatarUrl || null,
        isOnline: false,
    };
};
