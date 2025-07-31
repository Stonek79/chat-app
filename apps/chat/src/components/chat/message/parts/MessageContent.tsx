'use client';

import type { DisplayMessage } from '@chat-app/core';
import { Box, Typography, useTheme } from '@mui/material';

interface MessageContentProps {
    message: Pick<DisplayMessage, 'contentType' | 'content' | 'mediaUrl'>;
    isCurrentUser: boolean;
}

export const MessageContent = ({ message, isCurrentUser }: MessageContentProps) => {
    const theme = useTheme();

    const bubbleStyles = {
        width: 'fit-content',
        height: '100%',
        maxWidth: '100%',
        backgroundColor: isCurrentUser
            ? (theme.palette as any).msgOutBg
            : (theme.palette as any).msgInBg,
        color: theme.palette.text.primary,
        borderRadius: '12px',
    };

    const renderContent = () => {
        switch (message.contentType) {
            case 'IMAGE':
                return (
                    <Box
                        component="img"
                        src={message.mediaUrl ?? ''}
                        alt="Изображение"
                        sx={{
                            maxWidth: '100%',
                            maxHeight: '300px',
                            borderRadius: 1,
                            mt: 1,
                        }}
                    />
                );
            default: // TEXT
                return <Typography variant="body2">{message.content}</Typography>;
        }
    };

    return <Box sx={bubbleStyles}>{renderContent()}</Box>;
};
