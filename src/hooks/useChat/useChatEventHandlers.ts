import { Dispatch, SetStateAction, useEffect } from 'react';

import {
    SERVER_EVENT_CHAT_CREATED,
    SERVER_EVENT_MESSAGE_DELETED,
    SERVER_EVENT_MESSAGES_READ,
    SERVER_EVENT_RECEIVE_MESSAGE,
    SERVER_EVENT_USER_JOINED,
    SERVER_EVENT_USER_LEFT,
} from '@/constants';
import { mapPrismaMessageToDisplayMessage, mapSocketMessageToDisplayMessage } from '@/lib';
import type {
    AppSocket,
    ClientChat,
    ClientChatParticipant,
    ClientMessageAction,
    DisplayMessage,
    SocketMessagePayload,
    SocketUserPresencePayload,
} from '@/types';

export interface UseChatEventHandlersProps {
    socket: AppSocket | null;
    chatId: string | null;
    userId: string | null;
    initialMessagesLoaded: boolean;
    setMessages: Dispatch<SetStateAction<DisplayMessage[]>>;
    setParticipants: Dispatch<SetStateAction<ClientChatParticipant[]>>;
    setChatDetails: Dispatch<SetStateAction<ClientChat | null>>;
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

        const handleReceiveMessage = (payload: SocketMessagePayload) => {
            console.log('[useChatEventHandlers] Received SERVER_EVENT_RECEIVE_MESSAGE:', payload);
            if (payload?.chatId === chatId) {
                const displayMessage = mapSocketMessageToDisplayMessage(payload, userId);
                setMessages(prevMessages => [...(prevMessages || []), displayMessage]);
                if (!initialMessagesLoaded) setInitialMessagesLoaded(true);
            }
        };

        const handleUserJoined = (payload: SocketUserPresencePayload) => {
            if (payload?.chatId === chatId) {
                const newParticipant: ClientChatParticipant = {
                    id: payload.userId,
                    username: payload.username,
                    email: payload.email,
                    role: payload.role,
                    avatarUrl: payload.avatarUrl,
                };
                setParticipants(prev =>
                    (prev || []).find(p => p.id === newParticipant.id)
                        ? prev
                        : [...(prev || []), newParticipant]
                );
            }
        };

        const handleUserLeft = (payload: SocketUserPresencePayload) => {
            if (payload?.chatId === chatId) {
                setParticipants(prev => (prev || []).filter(p => p.id !== payload.userId));
            }
        };

        const handleChatCreated = (chatData: ClientChat) => {
            if (!userId || !chatData?.members) return;

            const currentUserIsMember = chatData.members.some(member => member.id === userId);
            if (currentUserIsMember && chatData.id === chatId) {
                setChatDetails(chatData);
                if (chatData.messages && Array.isArray(chatData.messages)) {
                    const displayMessages = chatData.messages.map(message =>
                        mapPrismaMessageToDisplayMessage(message, userId)
                    );
                    setMessages(displayMessages);
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
                                    userId: payload.userId,
                                    readAt: payload.readAt,
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
            chatId: string;
            messageId: string;
            action: ClientMessageAction;
        }) => {
            if (payload?.chatId === chatId) {
                setMessages(prevMessages => {
                    if (!prevMessages || !Array.isArray(prevMessages)) return [];

                    return prevMessages.map(msg => {
                        if (msg?.id === payload.messageId) {
                            const actionExists = msg.actions?.some(
                                act => act.id === payload.action.id
                            );
                            return {
                                ...msg,
                                actions: actionExists
                                    ? msg.actions
                                    : [...(msg.actions || []), payload.action],
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
