import { Dispatch, SetStateAction, useEffect, useState } from 'react';

import { CLIENT_EVENT_JOIN_CHAT } from '@/constants';
import { fetchChat, mapPrismaMessageToDisplayMessage } from '@/lib';
import type { AppSocket, ClientChat, ClientChatParticipant, DisplayMessage } from '@/types';

export interface UseChatDataProps {
    chatId: string | null;
    socket: AppSocket | null;
    currentUserId: string;
}

export interface UseChatDataReturn {
    messages: DisplayMessage[];
    participants: ClientChatParticipant[];
    chatDetails: ClientChat | null;
    isLoadingChatDetails: boolean;
    initialMessagesLoaded: boolean;
    setMessages: Dispatch<SetStateAction<DisplayMessage[]>>;
    setParticipants: Dispatch<SetStateAction<ClientChatParticipant[]>>;
    setChatDetails: Dispatch<SetStateAction<ClientChat | null>>;
    setIsLoadingChatDetails: Dispatch<SetStateAction<boolean>>;
    setInitialMessagesLoaded: Dispatch<SetStateAction<boolean>>;
}

export const useChatData = ({
    chatId,
    socket,
    currentUserId,
}: UseChatDataProps): UseChatDataReturn => {
    const [messages, setMessages] = useState<DisplayMessage[]>([]);
    const [participants, setParticipants] = useState<ClientChatParticipant[]>([]);
    const [chatDetails, setChatDetails] = useState<ClientChat | null>(null);
    const [isLoadingChatDetails, setIsLoadingChatDetails] = useState<boolean>(false);
    const [initialMessagesLoaded, setInitialMessagesLoaded] = useState<boolean>(false);

    useEffect(() => {
        // Если нет currentUserId (пользователь не авторизован), не загружаем данные
        if (!chatId || !socket || !currentUserId) {
            setChatDetails(null);
            setMessages([]);
            setParticipants([]);
            setInitialMessagesLoaded(false);
            return;
        }

        setIsLoadingChatDetails(true);
        setInitialMessagesLoaded(false);
        setChatDetails(null);
        setMessages([]);
        setParticipants([]);

        fetchChat(chatId)
            .then(details => {
                if (details) {
                    setChatDetails(details);
                    if (details.messages && Array.isArray(details.messages)) {
                        const displayMessages = details.messages.map(message =>
                            mapPrismaMessageToDisplayMessage(message, currentUserId)
                        );
                        setMessages(displayMessages);
                    } else {
                        setMessages([]);
                    }
                    if (details.members) {
                        setParticipants(details.members);
                    }
                } else {
                    setMessages([]);
                }
            })
            .catch(error => {
                console.error('[useChatData] Error fetching chat details:', error);
                setChatDetails(null);
                setMessages([]);
            })
            .finally(() => {
                setIsLoadingChatDetails(false);
                setInitialMessagesLoaded(true);
            });

        if (socket.connected) {
            socket.emit(CLIENT_EVENT_JOIN_CHAT, chatId);
        }
    }, [chatId, socket, currentUserId]);

    return {
        messages,
        participants,
        chatDetails,
        isLoadingChatDetails,
        initialMessagesLoaded,
        setMessages,
        setParticipants,
        setChatDetails,
        setIsLoadingChatDetails,
        setInitialMessagesLoaded,
    };
};
