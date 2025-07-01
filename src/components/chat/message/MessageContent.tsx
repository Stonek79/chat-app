'use client';

import { Box, Typography } from '@mui/material';

import type { DisplayMessage } from '@/types';

interface MessageContentProps {
    message: Pick<DisplayMessage, 'contentType' | 'content' | 'mediaUrl'>;
}

export const MessageContent = ({ message }: MessageContentProps) => {
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
