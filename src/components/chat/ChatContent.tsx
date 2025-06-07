'use client';

import React, { useState, useCallback } from 'react';
import {
    Container,
    Typography,
    TextField,
    Button,
    Box,
    Paper,
    CircularProgress,
    Alert,
} from '@mui/material';
import { ChatListItem } from './ChatListItem';
import { useChat } from '@/hooks';
import { useMessageListScrollAndView } from '@/hooks';

interface ChatContentProps {
    chatId: string;
    currentUserId: string;
    isAdmin: boolean;
}

export const ChatContent = ({ chatId, currentUserId, isAdmin }: ChatContentProps) => {
    const {
        messages,
        participants,
        sendMessage,
        isConnected,
        chatName,
        isLoadingChatDetails,
        initialMessagesLoaded,
        markMessagesAsRead,
    } = useChat({ chatId });
    const [newMessage, setNewMessage] = useState('');

    const handleMessageView = useCallback(
        (messageId: string) => {
            markMessagesAsRead(messageId);
        },
        [markMessagesAsRead]
    );

    const { messagesContainerRef, messagesEndRef, setMessageRef } = useMessageListScrollAndView({
        messages,
        currentUserId,
        loading: isLoadingChatDetails || !initialMessagesLoaded,
        onMessageView: handleMessageView,
        initialMessagesLoaded,
        chatId,
    });

    const handleSendMessage = () => {
        if (newMessage.trim()) {
            sendMessage(newMessage.trim());
            setNewMessage('');
        }
    };

    if (!isConnected && !messages.length) {
        // Если нет подключения и нет сообщений (например, при первой загрузке и проблемах с сокетом)
        return (
            <Container sx={{ textAlign: 'center', mt: 4 }}>
                <CircularProgress />
                <Typography sx={{ mt: 2 }}>Подключение к чату...</Typography>
            </Container>
        );
    }

    // TODO: Более умная загрузка истории или отображение заглушки, если сообщений нет
    //       идет загрузка истории (если будет такой флаг в useChat)

    return (
        <Container maxWidth="md" sx={{ mt: 2, mb: 2 }}>
            <Typography variant="h5" gutterBottom>
                Чат: {chatName}
            </Typography>
            {!isConnected && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                    Соединение с сервером чата потеряно. Попытка переподключения...
                </Alert>
            )}
            <Paper
                ref={messagesContainerRef}
                elevation={3}
                sx={{ p: 2, maxHeight: '60vh', overflowY: 'auto', mb: 2, minHeight: '300px' }}
            >
                {(isLoadingChatDetails || !initialMessagesLoaded) && messages.length === 0 && (
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            height: '100%',
                        }}
                    >
                        <CircularProgress />
                    </Box>
                )}
                {!(isLoadingChatDetails || !initialMessagesLoaded) &&
                    messages.length === 0 &&
                    isConnected && (
                        <Typography sx={{ textAlign: 'center', color: 'text.secondary' }}>
                            Сообщений пока нет. Начните общение!
                        </Typography>
                    )}
                {messages.map(message => (
                    <div
                        key={message.id}
                        ref={el => setMessageRef(String(message.id), el)}
                        data-message-id={String(message.id)}
                    >
                        <ChatListItem
                            message={message}
                            currentUserId={currentUserId}
                            isAdmin={isAdmin}
                            onEdit={() => {
                                console.log('Edit click', message); /* TODO */
                            }}
                            onDelete={() => {
                                console.log('Delete click', message); /* TODO */
                            }}
                        />
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </Paper>
            <Box
                component="form"
                sx={{ display: 'flex', gap: 1 }}
                onSubmit={e => {
                    e.preventDefault();
                    handleSendMessage();
                }}
            >
                <TextField
                    fullWidth
                    variant="outlined"
                    placeholder="Введите сообщение..."
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    disabled={!isConnected}
                />
                <Button
                    variant="contained"
                    onClick={handleSendMessage}
                    disabled={!isConnected || !newMessage.trim()}
                >
                    Отправить
                </Button>
            </Box>
            <Typography variant="caption" sx={{ mt: 2 }}>
                Участники: {participants.map(p => p.username).join(', ')}
            </Typography>
        </Container>
    );
};
