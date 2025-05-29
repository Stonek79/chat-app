// src/hooks/useChat.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { Socket } from 'socket.io-client';
import {
    getChatSocket,
    connectChatSocket,
    emitJoinChat,
    emitLeaveChat,
    emitSendMessage,
    onReceiveMessage,
    onUserJoined,
    onUserLeft,
} from '@/sockets';

import type {
    ClientChat,
    MessageContentType,
    SocketMessagePayload,
    SocketUserPresencePayload,
    ClientSendMessagePayload,
} from '@/types';
import { useAuth } from './useAuth';
import { fetchChat } from '@/lib/fetch/fetchChat';

export interface UseChatOptions {
    chatId: string | null;
}

export interface UseChatReturn {
    messages: SocketMessagePayload[]; // Временно возвращаем SocketMessagePayload[]
    participants: SocketUserPresencePayload[];
    sendMessage: (content: string, contentType?: string, mediaUrl?: string) => void; // contentType временно string
    isConnected: boolean;
    chatName: string | null;
    isLoadingChatDetails: boolean;
    initialMessagesLoaded: boolean;
}

export const useChat = ({ chatId }: UseChatOptions): UseChatReturn => {
    const { user } = useAuth();
    const [messages, setMessages] = useState<SocketMessagePayload[]>([]);
    const [participants, setParticipants] = useState<SocketUserPresencePayload[]>([]);
    const [isConnected, setIsConnected] = useState<boolean>(false);
    const [chatName, setChatName] = useState<string | null>(null);
    const [isLoadingChatDetails, setIsLoadingChatDetails] = useState<boolean>(false);
    const [initialMessagesLoaded, setInitialMessagesLoaded] = useState<boolean>(false);
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        socketRef.current = getChatSocket();
        if (socketRef.current) {
            if (!socketRef.current.connected) connectChatSocket();
            setIsConnected(socketRef.current.connected);
            const handleConnect = () => setIsConnected(true);
            const handleDisconnect = () => setIsConnected(false);
            socketRef.current.on('connect', handleConnect);
            socketRef.current.on('disconnect', handleDisconnect);
            return () => {
                socketRef.current?.off('connect', handleConnect);
                socketRef.current?.off('disconnect', handleDisconnect);
            };
        }
    }, []);

    useEffect(() => {
        const currentSocket = socketRef.current;
        if (chatId && currentSocket) {
            const initChat = async () => {
                setIsLoadingChatDetails(true);
                setInitialMessagesLoaded(false);
                setChatName(null);
                setMessages([]);
                setParticipants([]);
                try {
                    // Предполагаем, что fetchChat возвращает ClientChat, где messages это SocketMessagePayload[] или совместимый тип
                    const chatDetails: Partial<
                        ClientChat & { messages: SocketMessagePayload[] }
                    > | null = await fetchChat(chatId);
                    if (chatDetails) {
                        setChatName(chatDetails.name ?? 'Имя чата не найдено');
                        if (chatDetails.messages && Array.isArray(chatDetails.messages)) {
                            setMessages(chatDetails.messages);
                        }
                        setInitialMessagesLoaded(true);
                    }
                } catch (error) {
                    console.error('Ошибка загрузки деталей чата в useChat:', error);
                    setChatName('Ошибка загрузки имени чата');
                }
                setIsLoadingChatDetails(false);
                if (currentSocket.connected) {
                    emitJoinChat(chatId);
                } else {
                    const onConnect = () => {
                        emitJoinChat(chatId);
                        currentSocket.off('connect', onConnect);
                    };
                    currentSocket.on('connect', onConnect);
                }
            };
            initChat();
            const handleReceivedMessage = (payload: SocketMessagePayload) => {
                if (payload.chatId === chatId) {
                    // Здесь не будет сложной трансформации, просто добавляем payload
                    setMessages(prev => [...prev, payload]);
                }
            };
            const unsubscribeMessage = onReceiveMessage(handleReceivedMessage);

            const handleUserJoined = (data: SocketUserPresencePayload) => {
                if (data.chatId === chatId) {
                    setParticipants(prev =>
                        prev.find(p => p.userId === data.userId) ? prev : [...prev, data]
                    );
                }
            };
            const unsubscribeUserJoined = onUserJoined(handleUserJoined);

            const handleUserLeft = (data: SocketUserPresencePayload) => {
                if (data.chatId === chatId) {
                    setParticipants(prev => prev.filter(p => p.userId !== data.userId));
                }
            };
            const unsubscribeUserLeft = onUserLeft(handleUserLeft);

            return () => {
                if (currentSocket.connected) emitLeaveChat(chatId);
                unsubscribeMessage();
                unsubscribeUserJoined();
                unsubscribeUserLeft();
                setChatName(null);
                setMessages([]);
                setParticipants([]);
                setInitialMessagesLoaded(false);
            };
        }
    }, [chatId, user, isConnected]);

    const sendMessage = useCallback(
        (
            content: string,
            contentType?: string /* Prisma MessageContentType */,
            mediaUrl?: string
        ) => {
            const currentSocket = socketRef.current;
            if (chatId && user && currentSocket?.connected) {
                // ClientSendMessagePayload.contentType ожидает MessageContentType (Prisma enum)
                // или string, если мы не можем предоставить enum.
                // Для временного упрощения, оставим как есть, но это нужно будет согласовать
                // с определением ClientSendMessagePayload (сейчас он ожидает MessageContentType)
                const payload: ClientSendMessagePayload = {
                    chatId,
                    content,
                    contentType: contentType as MessageContentType, // Временное приведение, если ClientSendMessagePayload ожидает MessageContentType
                    mediaUrl,
                };
                emitSendMessage(payload);
            } else {
                console.warn(
                    'Сообщение не отправлено: нет chatId, пользователя или сокет не подключен.'
                );
            }
        },
        [chatId, user]
    );

    return {
        messages,
        participants,
        sendMessage,
        isConnected,
        chatName,
        isLoadingChatDetails,
        initialMessagesLoaded,
    };
};
