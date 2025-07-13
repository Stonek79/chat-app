'use client';

import { useState } from 'react';
import { Box, IconButton, InputBase } from '@mui/material';
import { AttachFile, SentimentSatisfiedOutlined, Send } from '@mui/icons-material';

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
            onSubmit={e => {
                e.preventDefault();
                handleSendMessage();
            }}
            sx={{
                p: 1,
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                backgroundColor: 'background.default',
                borderTop: '1px solid',
                borderColor: 'divider',
            }}
        >
            <IconButton sx={{ p: '10px' }} aria-label="attach file">
                <AttachFile />
            </IconButton>
            <Box
                sx={{
                    flex: 1,
                    mx: 1,
                    px: 1.5,
                    py: 0.5,
                    backgroundColor: 'background.paper',
                    borderRadius: '20px',
                    display: 'flex',
                    alignItems: 'center',
                }}
            >
                <InputBase
                    sx={{ flex: 1 }}
                    placeholder="Write a message..."
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    disabled={!isConnected}
                    onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                        }
                    }}
                />
                <IconButton sx={{ p: '10px' }} aria-label="emoji">
                    <SentimentSatisfiedOutlined />
                </IconButton>
            </Box>
            <IconButton
                color="primary"
                sx={{ p: '10px' }}
                aria-label="send message"
                onClick={handleSendMessage}
                disabled={!isConnected || !newMessage.trim()}
            >
                <Send />
            </IconButton>
        </Box>
    );
};
