'use client';

import type { ReactNode } from 'react';
import { Paper } from '@mui/material';

interface MessageBubbleProps {
    isCurrentUser: boolean;
    children: ReactNode;
    isMobile: boolean;
    isGroupChat: boolean;
}

export const MessageBubble = ({ isCurrentUser, children, isMobile, isGroupChat }: MessageBubbleProps) => (
    <Paper
        elevation={isCurrentUser ? 3 : 1}
        sx={{
            p: isMobile ? 1 : 0,
            width: '90%',
            bgcolor: isMobile ? (isCurrentUser ? 'primary.light' : 'background.paper') : 'inherit',
            color: isMobile ? (isCurrentUser ? 'primary.contrastText' : 'text.primary') : 'inherit',
            borderRadius: isCurrentUser ? '12px 12px 0 12px' : '12px 12px 12px 0',
            boxShadow: isMobile ? 'none' : 'inherit',
            position: 'relative',
            display: 'flex',
            justifyContent: 'space-between',
        }}
    >
        {children}
    </Paper>
);
