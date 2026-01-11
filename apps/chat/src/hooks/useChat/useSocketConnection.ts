'use client';

import { useEffect, useState } from 'react';

import {
    getSocket,
    SERVER_EVENT_USER_STATUS_CHANGED,
    SERVER_EVENT_CHAT_CREATED,
    SERVER_EVENT_CHAT_DELETED,
    UserStatusChangedPayload,
    ChatDeletedPayload,
    SERVER_EVENT_TYPING_STARTED,
    SERVER_EVENT_TYPING_STOPPED,
    TypingPayload
} from '@chat-app/socket-shared';
import { SOCKET_EVENT_CONNECT, SOCKET_EVENT_DISCONNECT, ChatWithDetails } from '@chat-app/core';
import useChatStore from '@/store/chatStore';

export const useSocketConnection = (): { isConnected: boolean } => {
    const [isConnected, setIsConnected] = useState(() => getSocket().connected);
    const { updateUserStatus, addChat, removeChat, setTypingUser } = useChatStore((state) => ({
        updateUserStatus: state.updateUserStatus,
        addChat: state.addChat,
        removeChat: state.removeChat,
        setTypingUser: state.setTypingUser,
    }));

    useEffect(() => {
        const socket = getSocket();
        const handleConnect = () => setIsConnected(true);
        const handleDisconnect = () => setIsConnected(false);
        
        const handleUserStatusChange = (payload: UserStatusChangedPayload) => {
            console.log('[useSocketConnection] Received SERVER_EVENT_USER_STATUS_CHANGED', payload);
            updateUserStatus(payload.userId, payload.isOnline, payload.lastSeenAt);
        };

        const handleChatCreated = (chat: ChatWithDetails) => {
            console.log('[useSocketConnection] Received SERVER_EVENT_CHAT_CREATED', chat.id);
            addChat(chat as any);
        };

        const handleChatDeleted = (payload: ChatDeletedPayload) => {
            console.log('[useSocketConnection] Received SERVER_EVENT_CHAT_DELETED', payload.chatId);
            removeChat(payload.chatId);
        };

        const handleTypingStarted = (payload: TypingPayload) => {
            console.log('[useSocketConnection] Received SERVER_EVENT_TYPING_STARTED', payload);
            if (payload.username) {
                setTypingUser(payload.username, true);
            }
        };

        const handleTypingStopped = (payload: TypingPayload) => {
            console.log('[useSocketConnection] Received SERVER_EVENT_TYPING_STOPPED', payload);
            if (payload.username) {
                setTypingUser(payload.username, false);
            }
        };

        socket.on(SOCKET_EVENT_CONNECT, handleConnect);
        socket.on(SOCKET_EVENT_DISCONNECT, handleDisconnect);
        socket.on(SERVER_EVENT_USER_STATUS_CHANGED, handleUserStatusChange);
        socket.on(SERVER_EVENT_CHAT_CREATED, handleChatCreated);
        socket.on(SERVER_EVENT_CHAT_DELETED, handleChatDeleted);
        socket.on(SERVER_EVENT_TYPING_STARTED, handleTypingStarted);
        socket.on(SERVER_EVENT_TYPING_STOPPED, handleTypingStopped);

        return () => {
            socket.off(SOCKET_EVENT_CONNECT, handleConnect);
            socket.off(SOCKET_EVENT_DISCONNECT, handleDisconnect);
            socket.off(SERVER_EVENT_USER_STATUS_CHANGED, handleUserStatusChange);
            socket.off(SERVER_EVENT_CHAT_CREATED, handleChatCreated);
            socket.off(SERVER_EVENT_CHAT_DELETED, handleChatDeleted);
            socket.off(SERVER_EVENT_TYPING_STARTED, handleTypingStarted);
            socket.off(SERVER_EVENT_TYPING_STOPPED, handleTypingStopped);
        };
    }, [updateUserStatus, addChat, removeChat, setTypingUser]);

    return { isConnected };
};
