'use client';

import { useEffect } from 'react';
import {
    CLIENT_EVENT_JOIN_CHAT,
    CLIENT_EVENT_LEAVE_CHAT,
    getSocket,
    type MessageDeletedPayload,
    type MessageEditedPayload,
    type MessagePayload,
    SERVER_EVENT_MESSAGE_DELETED,
    SERVER_EVENT_MESSAGE_EDITED,
    SERVER_EVENT_RECEIVE_MESSAGE,
} from '@chat-app/socket-shared';
import useChatStore from '@/store/chatStore';
import { convertMessagePayloadToDisplayMessage } from '@chat-app/core';
import { useSocketConnection } from './useSocketConnection';

export const useChatLifecycle = (chatId: string | null) => {
    // Получаем все необходимые экшены из стора
    const addMessage = useChatStore(state => state.addMessage);
    const updateMessage = useChatStore(state => state.updateMessage);
    const removeMessage = useChatStore(state => state.removeMessage);

    const { isConnected } = useSocketConnection();

    // Этот useEffect отвечает за подписку на события
    useEffect(() => {
        if (!isConnected) return;

        const socket = getSocket();

        const handleNewMessage = (payload: MessagePayload) => {
            if (payload?.chatId === chatId)
                addMessage(convertMessagePayloadToDisplayMessage(payload, payload.sender.id));
        };

        const handleMessageEdited = (payload: MessageEditedPayload) => {
            if (payload?.chatId === chatId) updateMessage(payload.id, payload);
        };

        const handleMessageDeleted = (payload: MessageDeletedPayload) => {
            if (payload?.chatId === chatId) removeMessage(payload.messageId);
        };

        socket.on(SERVER_EVENT_RECEIVE_MESSAGE, handleNewMessage);
        socket.on(SERVER_EVENT_MESSAGE_EDITED, handleMessageEdited);
        socket.on(SERVER_EVENT_MESSAGE_DELETED, handleMessageDeleted);

        return () => {
            socket.off(SERVER_EVENT_RECEIVE_MESSAGE, handleNewMessage);
            socket.off(SERVER_EVENT_MESSAGE_EDITED, handleMessageEdited);
            socket.off(SERVER_EVENT_MESSAGE_DELETED, handleMessageDeleted);
        };
    }, [chatId, addMessage, updateMessage, removeMessage, isConnected]);

    // Этот useEffect отвечает за вход/выход из комнаты
    useEffect(() => {
        const socket = getSocket();
        if (chatId && isConnected) {
            console.log(`[useChatLifecycle] Joining room: ${chatId}`);
            socket.emit(CLIENT_EVENT_JOIN_CHAT, chatId);
        }

        return () => {
            if (chatId) {
                console.log(`[useChatLifecycle] Leaving room: ${chatId}`);
                socket.emit(CLIENT_EVENT_LEAVE_CHAT, chatId);
            }
        };
    }, [chatId, isConnected]); // Зависит от chatId и статуса соединения
};
