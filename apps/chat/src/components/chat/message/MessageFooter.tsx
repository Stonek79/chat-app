'use client';

import type { DisplayMessage } from '@chat-app/core';
import { Box, Typography } from '@mui/material';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

import { MessageStatusIcon } from './MessageStatusIcon';

interface MessageFooterProps {
    message: Pick<
        DisplayMessage,
        'createdAt' | 'isEdited' | 'readReceipts' | 'isCurrentUser' | 'sender'
    >;
    currentUserId: string;
    isCurrentUser: boolean;
    isDeleted: boolean;
    participantsCount: number;
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
    currentUserId,
    isCurrentUser,
    isDeleted,
    participantsCount,
}: MessageFooterProps) => {
    const readByCount = message.readReceipts?.length ?? 0;
    const isReadByAll = readByCount >= participantsCount - 1;

    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                mt: 0.5,
            }}
        >
            {isCurrentUser && !isDeleted && (
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
                {formatTime(message.createdAt)}
            </Typography>
        </Box>
    );
};
