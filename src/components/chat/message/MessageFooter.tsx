'use client';

import { Box, Typography } from '@mui/material';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

import type { DisplayMessage } from '@/types';

import { MessageStatusIcon } from './MessageStatusIcon';
import { DeletedMessage } from './DeletedMessage';

interface MessageFooterProps {
    message: Pick<DisplayMessage, 'createdAt' | 'isEdited' | 'readReceipts' | 'isCurrentUser'>;
    currentUserId: string;
    isCurrentUser: boolean;
    isDeleted: boolean;

}

const formatTime = (date: Date | string) => {
    try {
        return format(new Date(date), 'HH:mm', { locale: ru });
    } catch (error) {
        console.error('Error formatting time:', error);
        return '';
    }
};

export const MessageFooter = ({ message, currentUserId, isCurrentUser, isDeleted }: MessageFooterProps) => {
    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                mt: 0.5,
            }}
        >
            {isCurrentUser && <MessageStatusIcon message={message} currentUserId={currentUserId} />}
            <Typography
                variant="caption"
                sx={{
                    color: message.isCurrentUser ? 'primary.contrastText' : 'text.secondary',
                    opacity: 0.7,
                    ml: 0.5,
                }}
            >
                {message.isEdited && (
                    <Typography component="span" sx={{ fontStyle: 'italic', mr: 0.5 }}>
                        (изм.)
                    </Typography>
                )}
                {formatTime(message.createdAt)}
            </Typography>
        </Box>
    );
};
