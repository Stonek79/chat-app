'use client';

import { useState } from 'react';
import { Box, Button,TextField } from '@mui/material';

interface MessageInputProps {
    onSendMessage: (content: string) => void;
    isConnected: boolean;
}

export const MessageInput = ({ onSendMessage, isConnected }: MessageInputProps) => {
    const [newMessage, setNewMessage] = useState('');

    const handleSendMessage = () => {
        if (newMessage.trim()) {
            onSendMessage(newMessage.trim());
            setNewMessage('');
        }
    };

    return (
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
    );
};
