import { Dispatch, SetStateAction, useEffect } from 'react';
import type { ChatParticipantInfo, ChatWithDetails, DisplayMessage } from '@chat-app/core';
import { convertMessagePayloadToDisplayMessage } from '@chat-app/core';
import type {
    AppClientSocket,
    SocketUserPresencePayload,
    MessagePayload,
} from '@chat-app/socket-shared';
import {
    SERVER_EVENT_CHAT_CREATED,
    SERVER_EVENT_MESSAGE_DELETED,
    SERVER_EVENT_RECEIVE_MESSAGE,
    SERVER_EVENT_USER_JOINED,
    SERVER_EVENT_USER_LEFT,
    SERVER_EVENT_MESSAGES_READ,
} from '@chat-app/socket-shared';

export interface UseChatEventHandlersProps {
    socket: AppClientSocket | null;
    chatId: string | null;
    userId: string | null;
    initialMessagesLoaded: boolean;
    setMessages: Dispatch<SetStateAction<DisplayMessage[]>>;
    setParticipants: Dispatch<SetStateAction<ChatParticipantInfo[]>>;
    setChatDetails: Dispatch<SetStateAction<ChatWithDetails | null>>;
    setIsLoadingChatDetails: Dispatch<SetStateAction<boolean>>;
    setInitialMessagesLoaded: Dispatch<SetStateAction<boolean>>;
}

export const useChatEventHandlers = ({
    socket,
    chatId,
    userId,
    initialMessagesLoaded,
    setMessages,
    setParticipants,
    setChatDetails,
    setIsLoadingChatDetails,
    setInitialMessagesLoaded,
}: UseChatEventHandlersProps): void => {
    useEffect(() => {
        if (!socket || !chatId || !userId) return;

        const handleReceiveMessage = (payload: MessagePayload) => {
            // Преобразуем MessagePayload в DisplayMessage
            const displayMessage = convertMessagePayloadToDisplayMessage(payload, userId);
            setMessages(prevMessages => [...prevMessages, displayMessage]);

            if (!initialMessagesLoaded) setInitialMessagesLoaded(true);
        };

        const handleUserJoined = (payload: SocketUserPresencePayload) => {
            if (payload?.chatId === chatId) {
                const newParticipant: ChatParticipantInfo = {
                    id: payload.userId,
                    chatId: payload.chatId,
                    userId: payload.userId,
                    role: 'MEMBER',
                    joinedAt: new Date(),
                    leftAt: null,
                    lastReadMessageId: null,
                    user: {
                        id: payload.userId,
                        username: payload.username,
                        email: payload.email,
                        avatarUrl: payload.avatarUrl,
                        role: payload.role,
                    },
                };
                setParticipants(prev => [...prev, newParticipant]);
            }
        };

        const handleUserLeft = (payload: SocketUserPresencePayload) => {
            if (payload?.chatId === chatId) {
                setParticipants(prev => prev.filter(p => p.userId !== payload.userId));
            }
        };

        const handleChatCreated = (chatData: ChatWithDetails) => {
            if (!userId || !chatData?.members) return;

            const currentUserIsMember = chatData.members.some(member => member.userId === userId);
            if (currentUserIsMember && chatData.id === chatId) {
                setChatDetails(chatData);
                if (chatData.messages && Array.isArray(chatData.messages)) {
                    // chatData.messages уже являются DisplayMessage[]
                    setMessages(chatData.messages);
                } else {
                    setMessages([]);
                }
                if (chatData.members) {
                    setParticipants(chatData.members);
                }
                setIsLoadingChatDetails(false);
                setInitialMessagesLoaded(true);
            }
        };

        const handleMessagesRead = (payload: {
            chatId: string;
            userId: string;
            lastReadMessageId: string;
            readAt: Date;
        }) => {
            if (payload?.chatId === chatId) {
                setMessages(prevMessages => {
                    if (!prevMessages || !Array.isArray(prevMessages)) return [];

                    const updatedMessages = prevMessages.map(msg => {
                        if (msg?.id && msg.id <= payload.lastReadMessageId) {
                            const alreadyRead = msg.readReceipts?.some(
                                receipt => receipt.userId === payload.userId
                            );

                            if (!alreadyRead) {
                                const newReadReceipt = {
                                    id: `${payload.userId}-${payload.lastReadMessageId}`,
                                    messageId: msg.id,
                                    userId: payload.userId,
                                    readAt: payload.readAt,
                                    user: {
                                        id: payload.userId,
                                        username: '',
                                        email: '',
                                        avatarUrl: null,
                                        role: '',
                                    },
                                };
                                return {
                                    ...msg,
                                    readReceipts: [...(msg.readReceipts || []), newReadReceipt],
                                };
                            }
                        }
                        return msg;
                    });

                    return updatedMessages;
                });
            }
        };

        const handleMessageDeleted = (payload: {
            messageId: string;
            chatId: string;
            deletedAt: Date;
        }) => {
            if (payload?.chatId === chatId) {
                setMessages(prevMessages => {
                    if (!prevMessages || !Array.isArray(prevMessages)) return [];

                    return prevMessages.map(msg => {
                        if (msg?.id === payload.messageId) {
                            return {
                                ...msg,
                                deletedAt: payload.deletedAt,
                                content: 'Сообщение удалено',
                            };
                        }
                        return msg;
                    });
                });
            }
        };

        // Подписываемся на события
        socket.on(SERVER_EVENT_RECEIVE_MESSAGE, handleReceiveMessage);
        socket.on(SERVER_EVENT_USER_JOINED, handleUserJoined);
        socket.on(SERVER_EVENT_USER_LEFT, handleUserLeft);
        socket.on(SERVER_EVENT_CHAT_CREATED, handleChatCreated);
        socket.on(SERVER_EVENT_MESSAGES_READ, handleMessagesRead);
        socket.on(SERVER_EVENT_MESSAGE_DELETED, handleMessageDeleted);

        // Очистка подписок
        return () => {
            socket.off(SERVER_EVENT_RECEIVE_MESSAGE, handleReceiveMessage);
            socket.off(SERVER_EVENT_USER_JOINED, handleUserJoined);
            socket.off(SERVER_EVENT_USER_LEFT, handleUserLeft);
            socket.off(SERVER_EVENT_CHAT_CREATED, handleChatCreated);
            socket.off(SERVER_EVENT_MESSAGES_READ, handleMessagesRead);
            socket.off(SERVER_EVENT_MESSAGE_DELETED, handleMessageDeleted);
        };
    }, [
        socket,
        chatId,
        userId,
        initialMessagesLoaded,
        setMessages,
        setParticipants,
        setChatDetails,
        setIsLoadingChatDetails,
        setInitialMessagesLoaded,
    ]);
};
