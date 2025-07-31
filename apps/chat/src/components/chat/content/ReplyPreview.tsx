import { Box, IconButton, Typography } from '@mui/material';
import { Close } from '@mui/icons-material';
import useChatStore from '@/store/chatStore';
import { shallow } from 'zustand/vanilla/shallow';

export const ReplyPreview = () => {
    const { replyToMessage, clearReplyToMessage } = useChatStore(
        state => ({
            replyToMessage: state.activeChat.replyToMessage,
            clearReplyToMessage: state.clearReplyToMessage,
        }),
        shallow
    );

    if (replyToMessage) {
        return (
            <Box
                sx={{
                    p: 1,
                    borderLeft: '4px solid',
                    borderColor: 'primary.main',
                    bgcolor: 'action.hover',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}
            >
                <Box>
                    <Typography variant="subtitle2" color="primary.main">
                        {replyToMessage.sender.username}
                    </Typography>
                    <Typography variant="body2" noWrap sx={{ opacity: 0.7 }}>
                        {replyToMessage.content}
                    </Typography>
                </Box>
                <IconButton onClick={clearReplyToMessage} size="small">
                    <Close fontSize="small" />
                </IconButton>
            </Box>
        );
    }

    return null;
};
