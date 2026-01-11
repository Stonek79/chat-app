import { StateCreator } from 'zustand';
import { ChatStore, ActiveChatSlice, ActiveChatState } from '../types';
import {
    getSocket,
    CLIENT_EVENT_SEND_MESSAGE,
    CLIENT_EVENT_MARK_AS_READ,
} from '@chat-app/socket-shared';
import {
    DisplayMessage,
    SendMessagePayload,
    ChatParticipantInfo,
} from '@chat-app/core';
import { ChatApi } from '@/lib/api/chatApi';

const initialActiveChatState: ActiveChatState = {
    activeChatDetails: null,
    activeChatMessages: [],
    activeChatParticipants: [],
    activeChatLoading: true,
    hasMoreMessages: true,
    nextMessageCursor: null,
    replyToMessage: null,
    messageToEdit: null,
};

export const createActiveChatSlice: StateCreator<ChatStore, [], [], ActiveChatSlice> = (set, get) => ({
    activeChat: initialActiveChatState,
    isLoadingMore: false,

    fetchActiveChat: async (chatId) => {
        set({ activeChat: { ...initialActiveChatState, activeChatLoading: true } });

        try {
            const details = await ChatApi.getChatDetails(chatId);
            if (!details) throw new Error('Чат не найден');

            const currentUser = get().currentUser;
            if (!currentUser) throw new Error('Текущий пользователь не определен');

            const selfParticipant = details.members.find((p) => p.userId === currentUser.id);
            const anchorId = selfParticipant?.lastReadMessageId ?? undefined;

            const messagesData = await ChatApi.getMessages(chatId, { anchorId });

            set((state) => ({
                activeChat: {
                    ...state.activeChat,
                    activeChatDetails: details,
                    activeChatMessages: messagesData.messages || [],
                    activeChatParticipants: details?.members || [],
                    nextMessageCursor: messagesData.nextCursor,
                    hasMoreMessages: !!messagesData.nextCursor,
                    activeChatLoading: false,
                },
            }));
        } catch (error) {
            console.error('[ChatStore] Error fetching chat data:', error);
            set((state) => ({
                activeChat: { ...state.activeChat, activeChatLoading: false },
            }));
        }
    },

    loadMoreMessages: async () => {
        const { activeChat } = get();
        if (!activeChat.nextMessageCursor || !activeChat.activeChatDetails?.id) {
            return;
        }

        set({ isLoadingMore: true });

        try {
            const messagesData = await ChatApi.getMessages(activeChat.activeChatDetails.id, {
                cursor: activeChat.nextMessageCursor
            });

            set((state) => {
                const existingMessageIds = new Set(
                    state.activeChat.activeChatMessages.map((msg) => msg.id)
                );

                const uniqueNewMessages = messagesData.messages.filter(
                    (msg) => !existingMessageIds.has(msg.id)
                );

                if (uniqueNewMessages.length === 0 && messagesData.messages.length > 0) {
                    return {
                        activeChat: {
                            ...state.activeChat,
                            nextMessageCursor: messagesData.nextCursor,
                            hasMoreMessages: !!messagesData.nextCursor,
                        },
                    };
                }

                return {
                    activeChat: {
                        ...state.activeChat,
                        activeChatMessages: [
                            ...uniqueNewMessages,
                            ...state.activeChat.activeChatMessages,
                        ],
                        nextMessageCursor: messagesData.nextCursor,
                        hasMoreMessages: !!messagesData.nextCursor,
                    },
                };
            });
        } catch (error) {
            console.error('[loadMoreMessages] Error:', error);
            set((state) => ({
                activeChat: { ...state.activeChat, hasMoreMessages: false },
            }));
        } finally {
            set({ isLoadingMore: false });
        }
    },

    sendMessage: (content, contentType, mediaUrl) => {
        const socket = getSocket();
        const activeChatDetails = get().activeChat.activeChatDetails;
        const replyToMessage = get().activeChat.replyToMessage;
        const currentUser = get().currentUser;
        const chatId = activeChatDetails?.id;

        if (!socket.connected || !chatId || !currentUser) return;

        const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

        const tempMessage: DisplayMessage = {
            id: tempId,
            chatId,
            senderId: currentUser.id,
            content,
            contentType: contentType || 'TEXT',
            mediaUrl: mediaUrl || null,
            createdAt: new Date(),
            updatedAt: new Date(),
            isEdited: false,
            isPinned: false,
            status: 'sending',
            sender: currentUser,
            replyTo: replyToMessage || undefined, // Исправлено: null -> undefined
            replyToMessageId: replyToMessage?.id || null,
            forwardedFromMessageId: null,
            readReceipts: [],
            actions: [],
            isCurrentUser: true,
            isOptimistic: true,
        };

        get().addMessage(tempMessage as DisplayMessage);

        const payload: SendMessagePayload = {
            chatId,
            content,
            contentType: contentType || 'TEXT',
            mediaUrl,
            replyToMessageId: replyToMessage?.id,
        };
        socket.emit(CLIENT_EVENT_SEND_MESSAGE, payload);

        get().clearReplyToMessage();
    },

    editMessage: async (messageId, newContent, newMediaUrl, newContentType) => {
        const { activeChat, currentUser } = get();
        if (!currentUser) return;
        const messageToEdit = activeChat.activeChatMessages.find((m) => m.id === messageId);
        if (!messageToEdit) return;

        const oldFields = {
            content: messageToEdit.content,
            mediaUrl: messageToEdit.mediaUrl,
            contentType: messageToEdit.contentType,
        };

        const newFields = {
            content: newContent,
            mediaUrl: newMediaUrl ?? oldFields.mediaUrl,
            contentType: newContentType ?? oldFields.contentType,
        };

        get().updateMessage(messageId, { content: newContent });

        try {
            await ChatApi.editMessage(messageId, newFields);
        } catch (error) {
            console.error('Error editing message:', error);
            get().updateMessage(messageId, oldFields);
        } finally {
            get().setMessageToEdit(null);
        }
    },

    deleteMessage: async (messageId) => {
        const { activeChat } = get();
        const messageToRemove = activeChat.activeChatMessages.find((m) => m.id === messageId);

        if (!messageToRemove) return;

        get().removeMessage(messageId);

        try {
            await ChatApi.deleteMessage(messageId);
        } catch (error) {
            console.error('[deleteMessage] Error:', error);
            get().addMessage(messageToRemove);
        }
    },

    clearActiveChat: () => set({ activeChat: initialActiveChatState }),

    markAsRead: (messageId) => {
        const socket = getSocket();
        const chatId = get().activeChat.activeChatDetails?.id;
        const message = get().activeChat.activeChatMessages.find((m) => m.id === messageId);
        
        if (message?.senderId === get().currentUser?.id || !chatId) {
            return;
        }

        socket.emit(CLIENT_EVENT_MARK_AS_READ, { chatId, messageId });
    },

    setReplyToMessage: (message) =>
        set((state) => ({
            activeChat: { ...state.activeChat, replyToMessage: message },
        })),

    clearReplyToMessage: () =>
        set((state) => ({
            activeChat: { ...state.activeChat, replyToMessage: null },
        })),

    setMessageToEdit: (message) =>
        set((state) => ({
            activeChat: { ...state.activeChat, messageToEdit: message },
        })),

    addMessage: (message) => {
        const { activeChat } = get();
        if (activeChat.activeChatDetails?.id !== message.chatId) return;

        set((state) => {
            const currentMessages = state.activeChat.activeChatMessages;
            const messageExists = currentMessages.some((m) => m.id === message.id);
            if (messageExists) return state;

            const optimisticIndex = currentMessages.findIndex(
                (m) =>
                    (m as any).isOptimistic &&
                    m.senderId === message.senderId &&
                    m.content === message.content &&
                    (new Date().getTime() - new Date(m.createdAt).getTime() < 30000)
            );

            if (optimisticIndex !== -1) {
                const newMessages = [...currentMessages];
                newMessages[optimisticIndex] = message;

                return {
                    activeChat: {
                        ...state.activeChat,
                        activeChatMessages: newMessages,
                    },
                };
            }

            return {
                activeChat: {
                    ...state.activeChat,
                    activeChatMessages: [...currentMessages, message],
                },
            };
        });
    },

    updateMessage: (messageId, updatedFields) =>
        set((state) => ({
            activeChat: {
                ...state.activeChat,
                activeChatMessages: state.activeChat.activeChatMessages.map((msg) =>
                    msg.id === messageId ? { ...msg, ...updatedFields } : msg
                ),
            },
        })),

    removeMessage: (messageId) =>
        set((state) => ({
            activeChat: {
                ...state.activeChat,
                activeChatMessages: state.activeChat.activeChatMessages.filter(
                    (msg) => msg.id !== messageId
                ),
            },
        })),

    updateUserStatus: (userId, isOnline, lastSeenAt) =>
        set((state) => {
            console.log('[ChatStore] updateUserStatus called', { userId, isOnline, lastSeenAt });
            const { activeChat } = state;
            
            // Helper to update members list
            const updateMembers = (members: ChatParticipantInfo[]) =>
                members.map((member) => {
                    if (member.userId === userId) {
                        return {
                            ...member,
                            user: {
                                ...member.user,
                                ...((isOnline !== undefined) && { isOnline }),
                                ...((lastSeenAt !== undefined) && { lastSeenAt: lastSeenAt ? new Date(lastSeenAt) : member.user.lastSeenAt }),
                            },
                        };
                    }
                    return member;
                });

            const updatedParticipants = updateMembers(activeChat.activeChatParticipants);
            
            const updatedDetails = activeChat.activeChatDetails
                ? {
                      ...activeChat.activeChatDetails,
                      members: updateMembers(activeChat.activeChatDetails.members),
                  }
                : null;

            return {
                activeChat: {
                    ...activeChat,
                    activeChatParticipants: updatedParticipants,
                    activeChatDetails: updatedDetails,
                },
            };
        }),

    typingUsers: [],

    setTypingUser: (username, isTyping) =>
        set((state) => {
            const currentTypingUsers = state.typingUsers;
            let newTypingUsers = [...currentTypingUsers];

            if (isTyping) {
                if (!newTypingUsers.includes(username)) {
                    newTypingUsers.push(username);
                }
            } else {
                newTypingUsers = newTypingUsers.filter((u) => u !== username);
            }

            return { typingUsers: newTypingUsers };
        }),
});
