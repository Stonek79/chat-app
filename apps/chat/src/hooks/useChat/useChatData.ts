import { Dispatch, SetStateAction, useEffect, useState, useCallback } from 'react';
import type { ChatWithDetails, ChatParticipantInfo, DisplayMessage } from '@chat-app/core';
import { getChatMessagesRoute } from '@chat-app/core';
import type { AppClientSocket } from '@chat-app/socket-shared';
import { CLIENT_EVENT_JOIN_CHAT } from '@chat-app/socket-shared';

import { fetchChat } from '@/lib';
import useChatStore from '@/store/chatStore';

export interface UseChatDataProps {
    chatId: string | null;
    socket: AppClientSocket | null;
    currentUserId: string;
}

export interface UseChatDataReturn {
    messages: DisplayMessage[];
    participants: ChatParticipantInfo[];
    chatDetails: ChatWithDetails | null;
    isLoadingChatDetails: boolean;
    initialMessagesLoaded: boolean;
    hasMoreMessages: boolean;
    loadMoreMessages: () => Promise<void>;
    isLoadingMore: boolean;
    firstUnreadId: string | null;
    setMessages: Dispatch<SetStateAction<DisplayMessage[]>>;
    setParticipants: Dispatch<SetStateAction<ChatParticipantInfo[]>>;
    setChatDetails: Dispatch<SetStateAction<ChatWithDetails | null>>;
    setIsLoadingChatDetails: Dispatch<SetStateAction<boolean>>;
    setInitialMessagesLoaded: Dispatch<SetStateAction<boolean>>;
}

export const useChatData = ({
    chatId,
    socket,
    currentUserId,
}: UseChatDataProps): UseChatDataReturn => {
    const [messages, setMessages] = useState<DisplayMessage[]>([]);
    const [participants, setParticipants] = useState<ChatParticipantInfo[]>([]);
    const [chatDetails, setChatDetails] = useState<ChatWithDetails | null>(null);
    const [isLoadingChatDetails, setIsLoadingChatDetails] = useState<boolean>(true);
    const [initialMessagesLoaded, setInitialMessagesLoaded] = useState<boolean>(false);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [hasMoreMessages, setHasMoreMessages] = useState<boolean>(true);
    const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
    const [firstUnreadId, setFirstUnreadId] = useState<string | null>(null);
    const resetUnreadCount = useChatStore(state => state.resetUnreadCount);

    const loadMoreMessages = useCallback(async () => {
        if (isLoadingMore || !nextCursor || !chatId) {
            return;
        }

        setIsLoadingMore(true);
        try {
            const url = `${getChatMessagesRoute(chatId)}?cursor=${nextCursor}`;
            const response = await fetch(url);

            if (response.ok) {
                const data = (await response.json()) as {
                    messages: DisplayMessage[];
                    nextCursor: string | null;
                };
                setMessages(prevMessages => [...data.messages, ...prevMessages]);
                setNextCursor(data.nextCursor);
                setHasMoreMessages(!!data.nextCursor);
            } else {
                console.error('Failed to fetch more messages');
                setHasMoreMessages(false);
                throw new Error('Failed to fetch more messages');
            }
        } catch (error) {
            console.error('Error fetching more messages:', error);
            setHasMoreMessages(false);
            throw error;
        } finally {
            setIsLoadingMore(false);
        }
    }, [chatId, nextCursor, isLoadingMore]);

    useEffect(() => {
        if (!chatId || !socket || !currentUserId) {
            setChatDetails(null);
            setMessages([]);
            setParticipants([]);
            setInitialMessagesLoaded(false);
            return;
        }

        resetUnreadCount(chatId);

        setIsLoadingChatDetails(true);
        setInitialMessagesLoaded(false);
        setChatDetails(null);
        setMessages([]);
        setParticipants([]);
        setNextCursor(null);
        setHasMoreMessages(true);
        setFirstUnreadId(null);

        const fetchChatData = async () => {
            try {
                const [details, messagesResponse] = await Promise.all([
                    fetchChat(chatId),
                    fetch(getChatMessagesRoute(chatId)),
                ]);

                if (details) {
                    setChatDetails(details);
                    setParticipants(details.members || []);
                }

                if (messagesResponse.ok) {
                    const messagesData = (await messagesResponse.json()) as {
                        messages: DisplayMessage[];
                        nextCursor: string | null;
                        firstUnreadId?: string;
                    };
                    setMessages(messagesData.messages || []);
                    setNextCursor(messagesData.nextCursor);
                    setHasMoreMessages(!!messagesData.nextCursor);
                    if (messagesData.firstUnreadId) {
                        setFirstUnreadId(messagesData.firstUnreadId);
                    }
                } else {
                    console.error(
                        '[useChatData] Error fetching messages:',
                        messagesResponse.statusText
                    );
                    setMessages([]);
                    setHasMoreMessages(false);
                }
            } catch (error) {
                console.error('[useChatData] Error fetching chat data:', error);
                setChatDetails(null);
                setMessages([]);
                setHasMoreMessages(false);
            } finally {
                setIsLoadingChatDetails(false);
                setInitialMessagesLoaded(true);
            }
        };

        fetchChatData();

        if (socket.connected) {
            socket.emit(CLIENT_EVENT_JOIN_CHAT, chatId);
        }
    }, [chatId, socket, currentUserId, resetUnreadCount]);

    return {
        messages,
        participants,
        chatDetails,
        isLoadingChatDetails,
        initialMessagesLoaded,
        hasMoreMessages,
        loadMoreMessages,
        isLoadingMore,
        firstUnreadId,
        setMessages,
        setParticipants,
        setChatDetails,
        setIsLoadingChatDetails,
        setInitialMessagesLoaded,
    };
};
