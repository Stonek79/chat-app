'use client';

import type { DisplayMessage } from '@chat-app/core';
import { Box, Typography } from '@mui/material';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

import { MessageStatusIcon } from './MessageStatusIcon';

interface MessageFooterProps {
    message: Pick<
        DisplayMessage,
        'createdAt' | 'updatedAt' | 'isEdited' | 'readReceipts' | 'isCurrentUser' | 'sender'
    >;
    isCurrentUser: boolean;
    participantsCount: number;
    isGroupChat: boolean;
    isMobile: boolean;
}

const formatTime = (date: Date | string) => {
    try {
        return format(new Date(date), 'HH:mm', { locale: ru });
    } catch (error) {
        console.error('Error formatting time:', error);
        return '';
    }
};

export const MessageFooter = ({
    message,
    isCurrentUser,
    participantsCount,
    isGroupChat,
    isMobile,
}: MessageFooterProps) => {
    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                mt: 0.5,
            }}
        >
            {isCurrentUser && !isGroupChat && !isMobile && (
                <MessageStatusIcon
                    message={message}
                    currentUserId={message.sender.id}
                    participantsCount={participantsCount}
                />
            )}
            <Typography
                variant="caption"
                sx={{
                    color: 'text.secondary',
                    fontSize: '0.675rem',
                    ml: 0.5,
                }}
            >
                {message.isEdited && (
                    <Typography
                        component="span"
                        sx={{ fontStyle: 'italic', mr: 0.5, fontSize: 'inherit' }}
                    >
                        (изм.)
                    </Typography>
                )}
                {formatTime(message.updatedAt)}
                {isCurrentUser && !isGroupChat && isMobile && (
                    <MessageStatusIcon
                        message={message}
                        currentUserId={message.sender.id}
                        participantsCount={participantsCount}
                    />
                )}
            </Typography>
        </Box>
    );
};
