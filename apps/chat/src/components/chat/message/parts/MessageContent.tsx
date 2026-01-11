'use client';

import type { DisplayMessage } from '@chat-app/core';
import { Box, Typography, useTheme } from '@mui/material';

interface MessageContentProps {
    message: Pick<DisplayMessage, 'contentType' | 'content' | 'mediaUrl'>;
    isCurrentUser: boolean;
}

const mediaStyles = {
    maxWidth: '100%',
    maxHeight: '300px',
    borderRadius: 1,
    mt: 1,
    display: 'block',
};

export const MessageContent = ({ message, isCurrentUser }: MessageContentProps) => {
    const theme = useTheme();

    const bubbleStyles = {
        width: 'fit-content',
        height: '100%',
        maxWidth: '100%',
        backgroundColor: isCurrentUser
            ? theme.palette.msgOutBg
            : theme.palette.msgInBg,
        color: theme.palette.text.primary,
        borderRadius: '12px',
        overflow: 'hidden',
    };

    const renderMedia = () => {
        switch (message.contentType) {
            case 'IMAGE':
                return (
                    <Box
                        component="img"
                        src={message.mediaUrl ?? ''}
                        alt="Изображение"
                        sx={mediaStyles}
                    />
                );
            case 'VIDEO':
                return (
                    <Box
                        component="video"
                        controls // Показываем элементы управления плеером
                        src={message.mediaUrl ?? ''}
                        sx={mediaStyles}
                    />
                );
            // TODO: Добавить обработку AUDIO и FILE в будущем
            default:
                return null;
        }
    };  

    const finalBubbleStyles = (message.mediaUrl && !message.content) 
        ? { ...bubbleStyles, padding: 0 }
        : bubbleStyles;

    return (
        <Box sx={finalBubbleStyles}>
            {/* Рендерим медиа, если есть ссылка */}
            {message.mediaUrl && renderMedia()}
            
            {/* Рендерим текст, если он есть */}
            {message.content && (
                <Typography variant="body2" sx={{ mt: message.mediaUrl ? 0.5 : 0 }}>
                    {message.content}
                </Typography>
            )}
        </Box>
    );
};
