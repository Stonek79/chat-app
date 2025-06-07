import { useState, useEffect, useCallback, useRef } from 'react';
import { connectSocket, fetchChat } from '@/lib';
import {
    CLIENT_EVENT_JOIN_CHAT,
    CLIENT_EVENT_LEAVE_CHAT,
    CLIENT_EVENT_SEND_MESSAGE,
    SERVER_EVENT_RECEIVE_MESSAGE,
    SERVER_EVENT_USER_JOINED,
    SERVER_EVENT_USER_LEFT,
    SERVER_EVENT_CHAT_CREATED,
    SOCKET_EVENT_CONNECT,
    SOCKET_EVENT_DISCONNECT,
    CLIENT_EVENT_MARK_AS_READ,
    SERVER_EVENT_MESSAGES_READ,
} from '@/constants';

import type {
    AppSocket,
    MessageContentType,
    SocketMessagePayload,
    SocketUserPresencePayload,
    ClientSendMessagePayload,
    Message,
    BasicUser,
    ClientChat,
    ClientChatParticipant,
    MessageReadReceipt,
} from '@/types';
import { useAuth } from './useAuth';

export interface UseChatReturn {
    messages: SocketMessagePayload[];
    participants: ClientChatParticipant[];
    sendMessage: (content: string, contentType?: MessageContentType, mediaUrl?: string) => void;
    isConnected: boolean;
    chatName: string | null;
    isLoadingChatDetails: boolean;
    initialMessagesLoaded: boolean;
    markMessagesAsRead: (lastReadMessageId: string) => void;
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
        contentType: dbMessage.contentType as MessageContentType,
        mediaUrl: dbMessage.mediaUrl,
        readReceipts: dbMessage.readReceipts || [],
        deletedAt: dbMessage.deletedAt,
    };
};

export const useChat = ({ chatId }: { chatId: string | null }): UseChatReturn => {
    const { user } = useAuth();
    const [messages, setMessages] = useState<SocketMessagePayload[]>([]);
    const [participants, setParticipants] = useState<ClientChatParticipant[]>([]);
    const [isConnected, setIsConnected] = useState<boolean>(false);
    const [chatName, setChatName] = useState<string | null>(null);
    const [isLoadingChatDetails, setIsLoadingChatDetails] = useState<boolean>(false);
    const [initialMessagesLoaded, setInitialMessagesLoaded] = useState<boolean>(false);

    const socketRef = useRef<AppSocket | null>(null);

    useEffect(() => {
        console.log('[useChat DEBUG] Socket connection effect RUNNING. Deps - chatId:', chatId);
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
        console.log(
            '[useChat DEBUG] Main chat logic effect RUNNING. Deps - chatId:',
            chatId,
            'user:',
            user?.id,
            'initialMessagesLoaded:',
            initialMessagesLoaded
        );
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
                        } else {
                            setMessages([]);
                        }
                    } else {
                        setMessages([]);
                    }
                    if (chatDetails?.members) {
                        setParticipants(chatDetails.members);
                    }
                })
                .catch(error => {
                    console.error('[useChat] Error fetching chat details:', error);
                    setChatName('Ошибка загрузки чата');
                    setMessages([]);
                })
                .finally(() => {
                    setIsLoadingChatDetails(false);
                    setInitialMessagesLoaded(true);
                });

            if (currentSocket.connected) {
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
                    const newParticipant: ClientChatParticipant = {
                        id: payload.userId,
                        username: payload.username,
                        email: payload.email,
                        role: payload.role as any,
                        avatarUrl: undefined,
                    };
                    setParticipants(prev =>
                        prev.find(p => p.id === newParticipant.id)
                            ? prev
                            : [...prev, newParticipant]
                    );
                }
            };

            const handleUserLeft = (payload: SocketUserPresencePayload) => {
                if (payload.chatId === chatId) {
                    setParticipants(prev => prev.filter(p => p.id !== payload.userId));
                }
            };

            const handleChatCreated = (chatData: ClientChat) => {
                if (!user || !chatData.members) return;
                const currentUserIsMember = chatData.members.some(member => member.id === user.id);
                if (currentUserIsMember) {
                    if (chatData.id === chatId) {
                        setChatName(chatData.name ?? `Чат ${chatData.id}`);
                        if (chatData.messages && Array.isArray(chatData.messages)) {
                            const normalizedMessages = chatData.messages.map(normalizeDbMessage);
                            setMessages(normalizedMessages);
                        } else {
                            setMessages([]);
                        }
                        if (chatData.members) {
                            setParticipants(chatData.members);
                        }
                        setIsLoadingChatDetails(false);
                        setInitialMessagesLoaded(true);
                    }
                }
            };

            const handleMessagesRead = (payload: {
                chatId: string;
                userId: string;
                lastReadMessageId: string;
                readAt: Date;
            }) => {
                if (payload.chatId === chatId) {
                    console.log(
                        '[useChat] Received SERVER_EVENT_MESSAGES_READ:',
                        JSON.stringify(payload)
                    );
                    setMessages(prevMessages => {
                        const updatedMessages = prevMessages.map(msg => {
                            if (msg.id && msg.id <= payload.lastReadMessageId) {
                                const alreadyRead = msg.readReceipts.some(
                                    receipt => receipt.userId === payload.userId
                                );

                                if (!alreadyRead) {
                                    const newReadReceipt: MessageReadReceipt = {
                                        userId: payload.userId,
                                        readAt: payload.readAt,
                                        messageId: msg.id,
                                        id: `client-receipt-${msg.id}-${payload.userId}`,
                                    };
                                    return {
                                        ...msg,
                                        readReceipts: [...msg.readReceipts, newReadReceipt],
                                    };
                                }
                            }
                            return msg;
                        });

                        return updatedMessages;
                    });
                }
            };

            currentSocket.on(SERVER_EVENT_RECEIVE_MESSAGE, handleReceiveMessage);
            currentSocket.on(SERVER_EVENT_USER_JOINED, handleUserJoined);
            currentSocket.on(SERVER_EVENT_USER_LEFT, handleUserLeft);
            currentSocket.on(SERVER_EVENT_CHAT_CREATED, handleChatCreated);
            currentSocket.on(SERVER_EVENT_MESSAGES_READ, handleMessagesRead);

            return () => {
                if (currentSocket.connected) {
                    currentSocket.emit(CLIENT_EVENT_LEAVE_CHAT, chatId);
                }
                currentSocket.off(SERVER_EVENT_RECEIVE_MESSAGE, handleReceiveMessage);
                currentSocket.off(SERVER_EVENT_USER_JOINED, handleUserJoined);
                currentSocket.off(SERVER_EVENT_USER_LEFT, handleUserLeft);
                currentSocket.off(SERVER_EVENT_CHAT_CREATED, handleChatCreated);
                currentSocket.off(SERVER_EVENT_MESSAGES_READ, handleMessagesRead);
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
                            createdAt?: Date;
                            error?: string;
                        };
                        if (response.success && response.messageId) {
                            console.log(
                                `[useChat] Message sent successfully, ID: ${response.messageId}, CreatedAt: ${response.createdAt}`
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

    const markMessagesAsRead = useCallback(
        (lastReadMessageId: string) => {
            const currentSocket = socketRef.current;
            if (chatId && user && currentSocket?.connected && lastReadMessageId) {
                currentSocket.emit(CLIENT_EVENT_MARK_AS_READ, {
                    chatId,
                    lastReadMessageId,
                });
            } else {
                console.warn('[useChat] Cannot mark messages as read:', {
                    chatId,
                    userExists: !!user,
                    socketConnected: currentSocket?.connected,
                    lastReadMessageId,
                });
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
        markMessagesAsRead,
    };
};
