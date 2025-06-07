import type {
    ClientChat,
    ChatLastMessage,
    ClientChatParticipant,
    Chat as PrismaChat,
    PrismaChatParticipant,
    User as PrismaUser,
    Message as PrismaMessage,
    MessageReadReceipt,
} from '@/types';

/**
 * Extended type for Prisma Chat, including related participant and message data,
 * necessary for forming the client-side representation of a chat.
 * Note: PrismaChatParticipant here will have its 'role' field typed as ChatParticipantRole.
 */
export type PrismaChatWithDetails = PrismaChat & {
    participants: (PrismaChatParticipant & {
        user: Pick<PrismaUser, 'id' | 'username' | 'avatarUrl' | 'email'>;
        // role is part of PrismaChatParticipant and will be ChatParticipantRole
    })[];
    messages: (PrismaMessage & {
        readReceipts: MessageReadReceipt[];
        sender: Pick<PrismaUser, 'id' | 'username' | 'email' | 'avatarUrl'>;
    })[];
};

/**
 * Converts a Prisma chat object (with details) to the ClientChat format suitable for the client.
 *
 * @param chatDb - The chat object from the database, including participants and last messages.
 * @param currentUserId - The ID of the currently authenticated user, necessary for correctly
 *                        determining the name and avatar of a private chat.
 * @returns A ClientChat object or null if the input data is incorrect.
 */
export const mapPrismaChatToClientChat = (
    chatDb: PrismaChatWithDetails,
    currentUserId: string
): ClientChat | null => {
    if (!chatDb) {
        return null;
    }

    let chatName = chatDb.name;
    let chatAvatarUrl: string | null | undefined = chatDb.isGroupChat ? chatDb.avatarUrl : null;

    const chatParticipantsData: ClientChatParticipant[] = chatDb.participants.map(p => ({
        id: p.user.id,
        username: p.user.username,
        avatarUrl: p.user.avatarUrl,
        role: p.role,
        email: p.user.email,
    }));

    if (!chatDb.isGroupChat) {
        const otherParticipant = chatDb.participants.find(p => p.user.id !== currentUserId);
        if (otherParticipant && otherParticipant.user) {
            chatName = otherParticipant.user.username;
            chatAvatarUrl = otherParticipant.user.avatarUrl;
        } else {
            chatName =
                chatDb.name ||
                (chatParticipantsData.length === 1 && chatParticipantsData[0].id === currentUserId
                    ? chatParticipantsData[0].username
                    : 'Личный чат');
            if (chatParticipantsData.length === 1 && chatParticipantsData[0].id === currentUserId) {
                chatAvatarUrl = chatParticipantsData[0].avatarUrl;
            }
        }
    }

    const lastMessageData =
        chatDb.messages && chatDb.messages.length > 0 ? chatDb.messages[0] : null;

    const lastMessageClient: ChatLastMessage | undefined = lastMessageData
        ? {
              id: lastMessageData.id,
              content: lastMessageData.content,
              createdAt: lastMessageData.createdAt,
              senderId: lastMessageData.sender.id,
              senderUsername: lastMessageData.sender.username,
              senderEmail: lastMessageData.sender.email,
          }
        : undefined;

    return {
        id: chatDb.id,
        name: chatName,
        isGroupChat: chatDb.isGroupChat,
        avatarUrl: chatAvatarUrl,
        members: chatParticipantsData,
        lastMessage: lastMessageClient,
        messages: chatDb.messages,
    };
};
