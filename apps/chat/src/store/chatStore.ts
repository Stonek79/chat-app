import { createWithEqualityFn } from 'zustand/traditional';
import { shallow } from 'zustand/vanilla/shallow';
import type {
    ChatWithDetails,
    DisplayMessage,
    ChatParticipantInfo,
    SendMessagePayload,
    ClientUser,
} from '@chat-app/core';
import {
    API_CHATS_ROUTE,
    API_MESSAGES_ROUTE,
    chatListResponseSchema,
    chatMessagesResponseSchema,
    getChatMessagesRoute,
} from '@chat-app/core';
import { fetchChat } from '@/lib';
import { type MessageContentType } from '@chat-app/db';
import {
    getSocket,
    CLIENT_EVENT_SEND_MESSAGE,
    CLIENT_EVENT_MARK_AS_READ,
} from '@chat-app/socket-shared';

// --- ИНТЕРФЕЙСЫ СОСТОЯНИЯ ---

interface ActiveChatState {
    activeChatDetails: ChatWithDetails | null;
    activeChatMessages: DisplayMessage[];
    activeChatParticipants: ChatParticipantInfo[];
    activeChatLoading: boolean;
    hasMoreMessages: boolean;
    nextMessageCursor: string | null;
    replyToMessage: DisplayMessage | null;
    messageToEdit: DisplayMessage | null;
}

interface ChatState {
    // Состояние списка чатов
    chats: ChatWithDetails[];
    isLoading: boolean;
    isLoadingMore: boolean;
    // Состояние активного чата
    activeChat: ActiveChatState;
    // Глобальное состояние
    currentUser: ClientUser | null;
    error: string | null;
}

// --- ИНТЕРФЕЙС ДЕЙСТВИЙ ---

interface ChatActions {
    // Системные экшены
    setCurrentUser: (user: ClientUser | null) => void;
    setAuthLoading: (isLoading: boolean) => void;

    // Экшены для списка чатов
    fetchChats: () => Promise<void>;
    addChat: (chat: ChatWithDetails) => void;
    updateLastMessage: (chatId: string, message: DisplayMessage) => void;
    incrementUnreadCount: (chatId: string) => void;
    resetUnreadCount: (chatId: string) => void;

    // Экшены для активного чата (с логикой)
    fetchActiveChat: (chatId: string) => Promise<void>;
    loadMoreMessages: () => Promise<void>;
    sendMessage: (content: string, contentType?: MessageContentType, mediaUrl?: string) => void;
    editMessage: (messageId: string, newContent: string) => Promise<void>;
    deleteMessage: (messageId: string) => Promise<void>;
    clearActiveChat: () => void;
    markAsRead: (messageId: string) => void;
    setReplyToMessage: (message: DisplayMessage | null) => void;
    clearReplyToMessage: () => void;
    setMessageToEdit: (message: DisplayMessage | null) => void;

    // Низкоуровневые экшены для сокетов (без логики, только меняют состояние)
    addMessage: (message: DisplayMessage) => void;
    updateMessage: (messageId: string, updatedFields: Partial<DisplayMessage>) => void;
    removeMessage: (messageId: string) => void;
}

type ChatStore = ChatState & ChatActions;

// --- НАЧАЛЬНОЕ СОСТОЯНИЕ ---

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

// --- РЕАЛИЗАЦИЯ СТОРА ---

const useChatStore = createWithEqualityFn<ChatStore>()(
    (set, get) => ({
        // Состояние
        chats: [],
        isLoading: true,
        isLoadingMore: false,
        error: null,
        activeChat: initialActiveChatState,
        currentUser: null,

        // --- РЕАЛИЗАЦИЯ ЭКШЕНОВ ---

        setCurrentUser: user => set({ currentUser: user, isLoading: false }),
        setAuthLoading: isLoading => set({ isLoading }),

        fetchChats: async () => {
            set({ isLoading: true, error: null });
            try {
                const response = await fetch(API_CHATS_ROUTE);
                if (!response.ok) throw new Error('Не удалось загрузить чаты');
                const data = await response.json();
                const { chats } = chatListResponseSchema.parse(data);
                set({ chats: chats || [], isLoading: false });
            } catch (e) {
                const error = e instanceof Error ? e.message : 'Неизвестная ошибка';
                console.error('[ChatStore] Ошибка при загрузке чатов:', e);
                set({ error, isLoading: false });
            }
        },

        fetchActiveChat: async chatId => {
            // 1. Начинаем загрузку, сбрасываем состояние активного чата
            set({ activeChat: { ...initialActiveChatState, activeChatLoading: true } });

            try {
                // 2. Сначала получаем ТОЛЬКО детали чата
                const details = await fetchChat(chatId);
                if (!details) {
                    throw new Error('Чат не найден');
                }

                const currentUser = get().currentUser;
                if (!currentUser) {
                    throw new Error('Текущий пользователь не определен');
                }

                // 3. Находим lastReadMessageId для текущего пользователя
                const selfParticipant = details.members.find(p => p.userId === currentUser.id);
                const anchorId = selfParticipant?.lastReadMessageId;

                // 4. Формируем URL для запроса сообщений
                const messagesUrl = new URL(getChatMessagesRoute(chatId), window.location.origin);
                if (anchorId) {
                    messagesUrl.searchParams.set('anchorId', anchorId);
                }

                // 5. Загружаем сообщения с правильным параметром
                const messagesResponse = await fetch(messagesUrl.toString());
                if (!messagesResponse.ok) {
                    throw new Error('Не удалось загрузить сообщения');
                }
                const messagesData = chatMessagesResponseSchema.parse(
                    await messagesResponse.json()
                );

                // 6. Обновляем состояние стора со всеми полученными данными
                set(state => ({
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
                set(state => ({
                    activeChat: { ...state.activeChat, activeChatLoading: false },
                }));
            }
        },

        loadMoreMessages: async () => {
            const { activeChat } = get();
            if (!activeChat.nextMessageCursor || !activeChat.activeChatDetails?.id) {
                console.warn('[loadMoreMessages] Aborted: no cursor or chat ID.');
                return;
            }

            set({ isLoadingMore: true });

            try {
                const url = `${getChatMessagesRoute(
                    activeChat.activeChatDetails.id
                )}?cursor=${activeChat.nextMessageCursor}`;

                const response = await fetch(url);

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(
                        `Failed to fetch more messages: ${response.status} ${errorText}`
                    );
                }

                const data = await response.json();

                const parsedData = chatMessagesResponseSchema.parse(data);

                set(state => {
                    // 1. Создаем Set с ID уже существующих сообщений для быстрой O(1) проверки.
                    const existingMessageIds = new Set(
                        state.activeChat.activeChatMessages.map(msg => msg.id)
                    );

                    // 2. Фильтруем новые сообщения, оставляя только те, которых еще нет в нашем стейте.
                    const uniqueNewMessages = parsedData.messages.filter(
                        msg => !existingMessageIds.has(msg.id)
                    );

                    // 3. Если после фильтрации ничего не осталось, это значит, что API прислал
                    // только дубликаты. В этом случае мы просто обновляем курсор и флаг `hasMore`,
                    // но не трогаем массив сообщений, чтобы избежать пустого пере-рендера.
                    if (uniqueNewMessages.length === 0 && parsedData.messages.length > 0) {
                        return {
                            activeChat: {
                                ...state.activeChat,
                                nextMessageCursor: parsedData.nextCursor,
                                hasMoreMessages: !!parsedData.nextCursor,
                            },
                        };
                    }

                    return {
                        activeChat: {
                            ...state.activeChat,
                            // 4. Добавляем в начало только уникальные новые сообщения.
                            activeChatMessages: [
                                ...uniqueNewMessages,
                                ...state.activeChat.activeChatMessages,
                            ],
                            nextMessageCursor: parsedData.nextCursor,
                            hasMoreMessages: !!parsedData.nextCursor,
                        },
                    };
                });
            } catch (error) {
                console.error('[loadMoreMessages] CATCH block error:', error);
                // В случае ошибки просто выключаем спиннер, чтобы не было вечной загрузки
                set(state => ({
                    activeChat: { ...state.activeChat, hasMoreMessages: false },
                }));
            } finally {
                console.log('[loadMoreMessages] Setting isLoadingMore to false.');
                set({ isLoadingMore: false });
            }
        },

        sendMessage: (content, contentType, mediaUrl) => {
            const socket = getSocket();
            const { activeChatDetails, replyToMessage } = get().activeChat;
            const chatId = activeChatDetails?.id;

            if (!socket.connected || !chatId) return;

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

        editMessage: async (messageId, newContent) => {
            const { activeChat, currentUser } = get();
            if (!currentUser) return;
            const messageToEdit = activeChat.activeChatMessages.find(m => m.id === messageId);
            if (!messageToEdit) return;

            const oldContent = messageToEdit.content;

            // Оптимистичное обновление
            get().updateMessage(messageId, { content: newContent });

            try {
                const response = await fetch(`${API_MESSAGES_ROUTE}/${messageId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ content: newContent }),
                });
                if (!response.ok) {
                    get().updateMessage(messageId, { content: oldContent }); // Откат
                }
            } catch (error) {
                console.error('Error editing message:', error);
                get().updateMessage(messageId, { content: oldContent }); // Откат
            } finally {
                get().setMessageToEdit(null);
            }
        },

        setMessageToEdit: message => {
            set(state => ({
                activeChat: {
                    ...state.activeChat,
                    messageToEdit: message,
                },
            }));
        },

        deleteMessage: async messageId => {
            const { activeChat } = get();
            const messageToRemove = activeChat.activeChatMessages.find(m => m.id === messageId);

            if (!messageToRemove) {
                console.warn(`[deleteMessage] Message with ID ${messageId} not found in store.`);
                return;
            }

            get().removeMessage(messageId); // Оптимистично удаляем из UI

            try {
                const response = await fetch(`${API_MESSAGES_ROUTE}/${messageId}`, {
                    method: 'DELETE',
                });

                // 3. Откат в случае ошибки API
                if (!response.ok) {
                    // Логируем ошибку для отладки
                    const errorData = await response.json().catch(() => null);
                    console.error(
                        `[deleteMessage] API error for message ${messageId}:`,
                        response.status,
                        errorData?.error || 'Unknown API error'
                    );
                    get().addMessage(messageToRemove); // Восстанавливаем сообщение
                }
                // Если все успешно, ничего делать не нужно, UI уже обновлен,
                // а сокет-событие от сервера подтвердит удаление для всех клиентов.
            } catch (error) {
                console.error(
                    `[deleteMessage] Network or other error for message ${messageId}:`,
                    error
                );
                get().addMessage(messageToRemove); // Восстанавливаем сообщение при любой ошибке
            }
        },

        markAsRead: messageId => {
            const socket = getSocket();
            const chatId = get().activeChat.activeChatDetails?.id;

            // Отправляем событие, только если все данные на месте
            const message = get().activeChat.activeChatMessages.find(m => m.id === messageId);
            if (message?.senderId === get().currentUser?.id || !chatId) {
                return;
            }

            socket.emit(CLIENT_EVENT_MARK_AS_READ, { chatId, messageId });
        },

        setReplyToMessage: message => {
            set(state => ({
                activeChat: {
                    ...state.activeChat,
                    replyToMessage: message,
                },
            }));
        },

        clearReplyToMessage: () => {
            set(state => ({
                activeChat: {
                    ...state.activeChat,
                    replyToMessage: null,
                },
            }));
        },

        clearActiveChat: () => set({ activeChat: initialActiveChatState }),

        addMessage: message => {
            // Добавляем сообщение, только если оно относится к текущему открытому чату
            if (get().activeChat.activeChatDetails?.id !== message.chatId) return;

            set(state => {
                // ПРОВЕРКА: Существует ли уже сообщение с таким ID?
                const messageExists = state.activeChat.activeChatMessages.some(
                    m => m.id === message.id
                );

                // Если сообщение уже есть в списке, ничего не делаем, чтобы избежать дубликатов.
                if (messageExists) {
                    return state;
                }

                // Если сообщения нет, добавляем его в конец массива.
                return {
                    activeChat: {
                        ...state.activeChat,
                        activeChatMessages: [...state.activeChat.activeChatMessages, message],
                    },
                };
            });
        },

        updateMessage: (messageId, updatedFields) => {
            set(state => ({
                activeChat: {
                    ...state.activeChat,
                    activeChatMessages: state.activeChat.activeChatMessages.map(msg =>
                        msg.id === messageId ? { ...msg, ...updatedFields } : msg
                    ),
                },
            }));
        },

        removeMessage: messageId => {
            set(state => ({
                activeChat: {
                    ...state.activeChat,
                    activeChatMessages: state.activeChat.activeChatMessages.filter(
                        msg => msg.id !== messageId
                    ),
                },
            }));
        },

        addChat: chat => set(state => ({ chats: [chat, ...state.chats] })),

        updateLastMessage: (chatId, message) => {
            set(state => ({
                chats: state.chats
                    .map(chat => {
                        if (chat.id === chatId) {
                            // Обновляем последнее сообщение и время обновления чата
                            return { ...chat, lastMessage: message, updatedAt: message.createdAt };
                        }
                        return chat;
                    })
                    // Сортируем чаты, чтобы тот, где было последнее сообщение, оказался наверху
                    .sort(
                        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
                    ),
            }));
        },

        incrementUnreadCount: chatId => {
            set(state => ({
                chats: state.chats.map(chat => {
                    if (chat.id === chatId) {
                        // Увеличиваем счетчик непрочитанных сообщений
                        return { ...chat, unreadCount: (chat.unreadCount ?? 0) + 1 };
                    }
                    return chat;
                }),
            }));
        },

        resetUnreadCount: chatId => {
            set(state => ({
                chats: state.chats.map(chat => {
                    if (chat.id === chatId) {
                        // Сбрасываем счетчик, когда пользователь открывает чат
                        return { ...chat, unreadCount: 0 };
                    }
                    return chat;
                }),
            }));
        },
    }),
    shallow
);

export default useChatStore;
