'use client';

import useChatStore from '@/store/chatStore';
import { Button, Typography } from '@mui/material';
import { shallow } from 'zustand/shallow';

export const NoChatsPage = () => {
    const { chats, isLoading } = useChatStore(
        state => ({
            chats: state.chats,
            isLoading: state.isLoading,
        }),
        shallow
    );

    if (isLoading) return null;

    return chats?.length > 0 ? (
        <Typography variant="h6" color="text.secondary">
            Выберите чат, чтобы начать общение.
        </Typography>
    ) : (
        <>
            <Typography sx={{ textAlign: 'center', fontSize: '2rem' }} variant="h4">
                У вас пока нет чатов
            </Typography>
            <Typography sx={{ textAlign: 'center', fontSize: '1.2rem' }} variant="body1">
                Создайте новый чат, чтобы начать общение.
            </Typography>
            <Button
                sx={{ width: '100%', mt: 2, maxWidth: 'fit-content' }}
                variant="contained"
                color="primary"
            >
                Создать чат
            </Button>
        </>
    );
};
