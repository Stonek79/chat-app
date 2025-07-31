import { Box, Typography } from '@mui/material';
import { DisplayMessage } from '@chat-app/core';

export const ReplyQuote = ({
    isMobile,
    message,
}: {
    isMobile: boolean;
    message: DisplayMessage;
}) => {    
    if (!message.replyTo) {
        return null;
    }

    const handleQuoteClick = () => {
        const element = document.getElementById(`message-${message.replyTo?.id}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Добавим временную подсветку
            element.style.transition = 'background-color 0.5s ease-in-out';
            element.style.backgroundColor = 'rgba(255, 255, 0, 0.2)';
            setTimeout(() => {
                element.style.backgroundColor = '';
            }, 1500);
        }
    };

    return isMobile ? (
        <Box
            onClick={handleQuoteClick}
            sx={{
                mb: 0.5,
                p: 1,
                borderLeft: '2px solid',
                borderColor: 'primary.light',
                bgcolor: 'rgba(0, 0, 0, 0.05)',
                borderRadius: 1,
                cursor: 'pointer',
                '&:hover': {
                    bgcolor: 'rgba(0, 0, 0, 0.08)',
                },
            }}
        >
            <Typography variant="caption" fontWeight="bold" color="primary.main">
                {message.replyTo.sender.username}
            </Typography>
            <Typography variant="caption" noWrap sx={{ display: 'block', opacity: 0.8 }}>
                {message.replyTo.content}
            </Typography>
        </Box>
    ) : (
        <Box
            onClick={handleQuoteClick}
            sx={{
                mb: 1,
                p: 1,
                borderLeft: '2px solid',
                borderColor: 'primary.main',
                bgcolor: 'action.hover',
                borderRadius: 1,
                cursor: 'pointer',
                '&:hover': {
                    bgcolor: 'action.selected',
                },
            }}
        >
            <Typography variant="subtitle2" color="primary.main">
                {message.replyTo.sender.username}
            </Typography>
            <Typography variant="body2" noWrap sx={{ opacity: 0.8 }}>
                {message.replyTo.content}
            </Typography>
        </Box>
    );
};
