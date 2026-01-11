'use client';

import { Alert, Box, CircularProgress, Typography, useTheme } from '@mui/material';
import { useSocketConnection, useChatContent } from '@/hooks';
import { ChatHeader } from './content/ChatHeader';
import { InputBar } from './Input/InputBar';
import { ChatMessagesList } from './message';
import { ConfirmationModal } from '@/components';
import { ScrollToBottomButton } from './content/ScrollToBottomButton';
import { DeleteChatModal } from './modals/DeleteChatModal';
import { getChatHeaderInfo, getChatStatus } from '@/utils/chatDisplayHelpers';

interface ChatContentProps {
    chatId: string;
}

export const ChatContent = ({ chatId }: ChatContentProps) => {
    const theme = useTheme();
    const { isConnected } = useSocketConnection();

    const {
        messages,
        participants,
        details,
        currentUser,
        isLoading,
        isLoadingMore,
        hasMoreMessages,
        typingUsers,
        loadMoreMessages,
        messageToDelete,
        isDeleteChatModalOpen,
        handleRequestDeleteChat,
        handleCloseDeleteChatModal,
        handleConfirmDeleteChat,
        handleCancelDeleteMessage,
        handleConfirmDeleteMessage,
        messagesContainerRef,
        messagesEndRef,
    } = useChatContent(chatId);

    if (isLoading && messages.length === 0) {
        return (
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
        );
    }

    if (!details) {
        return (
            <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography>Выберите чат, чтобы начать общение.</Typography>
            </Box>
        );
    }

    const headerInfo = getChatHeaderInfo(details, participants, currentUser);
    const chatStatus = getChatStatus(details, participants, currentUser, typingUsers);

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                maxHeight: '100vh',
                position: 'relative',
                backgroundColor: theme.palette.background.default,
            }}
        >
            <Box sx={{ flexShrink: 0 }}>
                <ChatHeader
                    chatId={chatId}
                    chatName={headerInfo.name}
                    chatAvatarUrl={headerInfo.avatarUrl || ''}
                    status={chatStatus}
                    isOnline={headerInfo.isOnline}
                    canDelete={details.canDelete || currentUser?.role === 'ADMIN'}
                    onDelete={handleRequestDeleteChat}
                />
                {!isConnected && (
                    <Alert severity="warning" sx={{ m: 1, flexShrink: 0 }}>
                        Соединение потеряно...
                    </Alert>
                )}
            </Box>
            <Box
                sx={{
                    flexGrow: 1,
                    overflowY: 'auto',
                    position: 'relative',
                }}
            >
                <ChatMessagesList
                    chatId={chatId}
                    messages={messages}
                    participants={participants}
                    hasMoreMessages={hasMoreMessages}
                    isLoadingMore={isLoadingMore}
                    loadMoreMessages={loadMoreMessages}
                    messagesContainerRef={messagesContainerRef}
                    messagesEndRef={messagesEndRef}
                />
                <ScrollToBottomButton
                    messagesContainerRef={messagesContainerRef}
                    messagesEndRef={messagesEndRef}
                />
            </Box>
            <InputBar />
            
            <ConfirmationModal
                open={!!messageToDelete}
                onClose={handleCancelDeleteMessage}
                onConfirm={handleConfirmDeleteMessage}
                title="Удалить сообщение?"
                description={
                    messageToDelete?.permanent
                        ? 'Это действие нельзя будет отменить.'
                        : 'Вы уверены, что хотите удалить это сообщение?'
                }
                confirmButtonText="Удалить"
            />
            
            <DeleteChatModal 
                open={isDeleteChatModalOpen}
                onClose={handleCloseDeleteChatModal}
                onConfirm={handleConfirmDeleteChat}
            />
        </Box>
    );
};


