'use client';

import { Box, Paper, Typography } from '@mui/material';

import type { DisplayMessage } from '@/types';

interface SystemMessageProps {
    message: DisplayMessage;
}

export const SystemMessage = ({ message }: SystemMessageProps) => (
    <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
        <Paper
            elevation={0}
            sx={{
                p: 1,
                backgroundColor: 'transparent',
                color: 'text.secondary',
            }}
        >
            <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                {message.content}
            </Typography>
        </Paper>
    </Box>
);
