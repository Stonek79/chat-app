import { useState, useEffect, useCallback, useRef } from 'react';
import { connectSocket, fetchChat } from '@/lib';
import {
    CLIENT_EVENT_JOIN_CHAT,
    CLIENT_EVENT_LEAVE_CHAT,
    CLIENT_EVENT_SEND_MESSAGE,
    SERVER_EVENT_RECEIVE_MESSAGE,
    SERVER_EVENT_USER_JOINED,
    SERVER_EVENT_USER_LEFT,
    SOCKET_EVENT_CONNECT,
    SOCKET_EVENT_DISCONNECT,
} from '@/constants';

import type {
    AppSocket,
    MessageContentType,
    SocketMessagePayload,
    SocketUserPresencePayload,
    ClientSendMessagePayload,
    Message,
    BasicUser,
} from '@/types';
import { useAuth } from './useAuth';

export interface UseChatReturn {
    messages: SocketMessagePayload[];
    participants: SocketUserPresencePayload[];
    sendMessage: (content: string, contentType?: MessageContentType, mediaUrl?: string) => void;
    isConnected: boolean;
    chatName: string | null;
    isLoadingChatDetails: boolean;
    initialMessagesLoaded: boolean;
}

const normalizeDbMessage = (dbMessage: Message): SocketMessagePayload => {
    const basicSender: BasicUser = {
        id: dbMessage.sender.id,
        username: dbMessage.sender.username,
        email: dbMessage.sender.email,
        role: dbMessage.sender.role,
        avatarUrl: dbMessage.sender.avatarUrl,
    };

    return {
        id: dbMessage.id,
        chatId: dbMessage.chatId,
        sender: basicSender,
        content: dbMessage.content,
        createdAt: dbMessage.createdAt,
        updatedAt: dbMessage.updatedAt,
        contentType: dbMessage.contentType,
        mediaUrl: dbMessage.mediaUrl,
        readReceipts: dbMessage.readReceipts,
        deletedAt: dbMessage.deletedAt,
    };
};

export const useChat = ({ chatId }: { chatId: string | null }): UseChatReturn => {
    const { user } = useAuth();
    const [messages, setMessages] = useState<SocketMessagePayload[]>([]);
    const [participants, setParticipants] = useState<SocketUserPresencePayload[]>([]);
    const [isConnected, setIsConnected] = useState<boolean>(false);
    const [chatName, setChatName] = useState<string | null>(null);
    const [isLoadingChatDetails, setIsLoadingChatDetails] = useState<boolean>(false);
    const [initialMessagesLoaded, setInitialMessagesLoaded] = useState<boolean>(false);

    const socketRef = useRef<AppSocket | null>(null);

    useEffect(() => {
        socketRef.current = connectSocket();

        const currentSocket = socketRef.current;

        if (currentSocket) {
            setIsConnected(currentSocket.connected);

            const handleConnect = () => {
                console.log('[useChat] Socket connected');
                setIsConnected(true);
                if (chatId) {
                    console.log(`[useChat] Re-joining chat room ${chatId} after connect.`);
                    currentSocket.emit(CLIENT_EVENT_JOIN_CHAT, chatId);
                }
            };

            const handleDisconnect = (reason: string) => {
                console.log(`[useChat] Socket disconnected, reason: ${reason}`);
                setIsConnected(false);
            };

            currentSocket.on(SOCKET_EVENT_CONNECT, handleConnect);
            currentSocket.on(SOCKET_EVENT_DISCONNECT, handleDisconnect);

            if (currentSocket.connected && chatId) {
                console.log(`[useChat] Socket already connected, joining chat room ${chatId}.`);
                currentSocket.emit(CLIENT_EVENT_JOIN_CHAT, chatId);
            }

            return () => {
                console.log('[useChat] Cleaning up socket connection effect.');
                currentSocket.off(SOCKET_EVENT_CONNECT, handleConnect);
                currentSocket.off(SOCKET_EVENT_DISCONNECT, handleDisconnect);
            };
        }
    }, [chatId]);

    useEffect(() => {
        const currentSocket = socketRef.current;
        if (chatId && currentSocket) {
            setIsLoadingChatDetails(true);
            setInitialMessagesLoaded(false);
            setChatName(null);
            setMessages([]);
            setParticipants([]);

            fetchChat(chatId)
                .then(chatDetails => {
                    if (chatDetails) {
                        setChatName(chatDetails.name ?? `Чат ${chatId}`);

                        if (chatDetails.messages && Array.isArray(chatDetails.messages)) {
                            const normalizedMessages = chatDetails.messages.map(normalizeDbMessage);
                            setMessages(normalizedMessages);
                            setInitialMessagesLoaded(true);
                        } else {
                            setMessages([]);
                            setInitialMessagesLoaded(true);
                        }
                    } else {
                        setMessages([]);
                        setInitialMessagesLoaded(true);
                    }

                    if (chatDetails?.members) {
                        console.log('[useChat] Chat members:', chatDetails.members);
                        setParticipants(
                            chatDetails.members.map(m => ({
                                chatId,
                                userId: m.id,
                                username: m.username,
                                avatarUrl: m.avatarUrl,
                                role: m.role,
                                email: m.email,
                            }))
                        );
                    }
                })
                .catch(error => {
                    console.error('[useChat] Error fetching chat details:', error);
                    setChatName('Ошибка загрузки чата');
                    setMessages([]);
                    setInitialMessagesLoaded(true);
                })
                .finally(() => {
                    setIsLoadingChatDetails(false);
                });

            if (currentSocket.connected) {
                console.log(
                    `[useChat] Joining chat room ${chatId}. Socket ID: ${currentSocket.id}`
                );
                currentSocket.emit(CLIENT_EVENT_JOIN_CHAT, chatId);
            }

            const handleReceiveMessage = (payload: SocketMessagePayload) => {
                console.log('[useChat] Received SERVER_EVENT_RECEIVE_MESSAGE:', payload);
                if (payload.chatId === chatId) {
                    setMessages(prevMessages => [...prevMessages, payload]);
                    if (!initialMessagesLoaded) setInitialMessagesLoaded(true);
                }
            };
            const handleUserJoined = (payload: SocketUserPresencePayload) => {
                if (payload.chatId === chatId) {
                    setParticipants(prev =>
                        prev.find(p => p.userId === payload.userId) ? prev : [...prev, payload]
                    );
                }
            };
            const handleUserLeft = (payload: SocketUserPresencePayload) => {
                if (payload.chatId === chatId) {
                    setParticipants(prev => prev.filter(p => p.userId !== payload.userId));
                }
            };

            currentSocket.on(SERVER_EVENT_RECEIVE_MESSAGE, handleReceiveMessage);
            currentSocket.on(SERVER_EVENT_USER_JOINED, handleUserJoined);
            currentSocket.on(SERVER_EVENT_USER_LEFT, handleUserLeft);

            return () => {
                console.log(`[useChat] Leaving chat room ${chatId} and unsubscribing from events.`);
                if (currentSocket.connected) {
                    currentSocket.emit(CLIENT_EVENT_LEAVE_CHAT, chatId);
                }
                currentSocket.off(SERVER_EVENT_RECEIVE_MESSAGE, handleReceiveMessage);
                currentSocket.off(SERVER_EVENT_USER_JOINED, handleUserJoined);
                currentSocket.off(SERVER_EVENT_USER_LEFT, handleUserLeft);
            };
        } else if (!chatId) {
            setChatName(null);
            setMessages([]);
            setParticipants([]);
            setInitialMessagesLoaded(false);
        }
    }, [chatId, user]);

    const sendMessage = useCallback(
        (content: string, contentType: MessageContentType = 'TEXT', mediaUrl?: string) => {
            const currentSocket = socketRef.current;
            if (chatId && user && currentSocket?.connected) {
                const payload: ClientSendMessagePayload = {
                    chatId,
                    content,
                    contentType,
                    mediaUrl,
                };
                currentSocket.emit(CLIENT_EVENT_SEND_MESSAGE, payload, ack => {
                    if (ack && typeof ack === 'object') {
                        const response = ack as {
                            success: boolean;
                            messageId?: string;
                            error?: string;
                        };
                        if (response.success && response.messageId) {
                            console.log(
                                `[useChat] Message sent successfully, ID: ${response.messageId}`
                            );
                        } else {
                            console.error(`[useChat] Failed to send message: ${response.error}`);
                        }
                    } else if (ack) {
                        console.warn(
                            '[useChat] Received ack for sent message with unexpected format:',
                            ack
                        );
                    } else {
                        console.log(
                            '[useChat] Message sent, no acknowledgement received from server.'
                        );
                    }
                });
            } else {
                console.warn(
                    '[useChat] Message not sent: no chatId, user, or socket not connected.',
                    { chatId, userExists: !!user, socketConnected: currentSocket?.connected }
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
