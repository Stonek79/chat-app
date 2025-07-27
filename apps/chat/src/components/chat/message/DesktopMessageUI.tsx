import { Avatar, Box, Typography, useTheme } from '@mui/material';
import { getUsernameColor } from '@/utils/colorUtils';
import { defaultAvatarName } from '../../ui';
import type { MessageUIProps } from './types';

export function DesktopMessageUI(props: MessageUIProps) {
    const { message, isSameSender, content, footer, actionsMenu } = props;
    const theme = useTheme();

    const showAvatarAndName = !isSameSender;

    const avatar = showAvatarAndName ? (
        <Avatar
            src={message.sender?.avatarUrl ?? undefined}
            alt={message.sender?.username ?? 'U'}
            sx={{ width: 40, height: 40 }}
            {...defaultAvatarName(message.sender?.username)}
        />
    ) : null;

    const senderName = showAvatarAndName ? (
        <Typography
            variant="body2"
            sx={{
                fontWeight: 'bold',
                color: getUsernameColor(message.sender.id),
            }}
        >
            {message.sender.username}
        </Typography>
    ) : null;

    return (
        <Box
            sx={{
                display: 'flex',
                px: 2,
                width: '100%',
                position: 'relative',
                '&:hover .message-actions': {
                    opacity: 1,
                },
                '&:hover': {
                    backgroundColor: theme.palette.action.hover,
                },
            }}
        >
            <Box sx={{ width: 40, mr: 2, flexShrink: 0, pt: 0.5 }}>{avatar}</Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden' }}>
                {senderName}
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: 2,
                    }}
                >
                    <Box sx={{ maxWidth: '600px', wordBreak: 'break-word' }}>{content}</Box>
                    <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                        <Box
                            className="message-actions"
                            sx={{ transition: 'opacity 0.2s', opacity: 0 }}
                        >
                            {actionsMenu}
                        </Box>
                        {footer}
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}
