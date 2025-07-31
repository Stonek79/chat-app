import { Avatar, Box, Typography, useTheme } from '@mui/material';
import { getUsernameColor } from '@/utils/colorUtils';
import { defaultAvatarName } from '../../ui';
import type { MessageUIProps } from './types';
import { useLayoutEffect, useRef, useState } from 'react';
import { ReplyQuote } from './parts/ReplyQuote';

export function MobileMessageUI(props: MessageUIProps) {
    const {
        message,
        isCurrentUser,
        isGroupChat,
        isSameSender,
        isNextMessageFromSameSender,
        content,
        footer,
        isMobile,
        // actionsMenu - пока не используем, добавим с long-press
    } = props;
    const theme = useTheme();
    const timeRef = useRef<HTMLDivElement>(null);
    const [timeWidth, setTimeWidth] = useState(0);

    useLayoutEffect(() => {
        if (timeRef.current) {
            const rect = timeRef.current.getBoundingClientRect();
            setTimeWidth(rect.width + 12); // 8px — зазор между текстом и временем
        }
    }, [footer]);

    // --- Логика для мобильного вида ---
    const showSenderName = isGroupChat && !isCurrentUser && !isSameSender;
    const showAvatar = isGroupChat && isNextMessageFromSameSender;

    // --- Определение стилей контейнера ---
    const align = isCurrentUser && !isGroupChat ? 'flex-end' : 'flex-start';
    const maxWidth = isGroupChat ? '90%' : '80%';

    const backgroundColor = isCurrentUser
        ? theme.chat.myMessageBackground
        : theme.chat.otherMessageBackground;

    return (
        <Box
            id={`message-${message.id}`}
            sx={{
                display: 'flex',
                justifyContent: align,
                mb: isNextMessageFromSameSender ? 0.25 : 1,
                px: 1,
                width: '100%',
                position: 'relative',
            }}
        >
            <Box
                sx={{
                    display: 'flex',
                    alignItems: align,
                    maxWidth: maxWidth,
                }}
            >
                <Avatar
                    src={message.sender?.avatarUrl ?? undefined}
                    alt={message.sender?.username ?? 'U'}
                    sx={{
                        mr: 0.5,
                        ml: 0.5,
                        width: 32,
                        height: 32,
                        fontSize: 16,
                        alignSelf: isGroupChat ? 'flex-end' : 'flex-start',
                        visibility: showAvatar ? 'hidden' : 'visible',
                    }}
                    {...defaultAvatarName(message.sender?.username)}
                />
                <Box
                    sx={{
                        p: 0.5,
                        pl: 1,
                        pr: 1,
                        borderRadius: '8px',
                        bgcolor: backgroundColor,
                        boxShadow: theme.shadows[1],
                        height: '100%',
                    }}
                >
                    <ReplyQuote isMobile={isMobile} message={message} />
                    {showSenderName && (
                        <Typography
                            sx={{
                                fontWeight: 'bold',
                                color: getUsernameColor(message.sender.id),
                                mb: 0.5,
                            }}
                            variant="caption"
                        >
                            {message.sender.username}
                        </Typography>
                    )}
                    <Box
                        sx={{
                            display: 'grid',
                            position: 'relative',
                        }}
                    >
                        <Box style={{ paddingRight: `${timeWidth}px`, wordBreak: 'break-word' }}>
                            {content}
                        </Box>

                        <Box
                            ref={timeRef}
                            sx={{
                                fontSize: '12px',
                                opacity: 0.7,
                                position: 'absolute',
                                bottom: 0,
                                right: '8px',
                                float: 'right',
                            }}
                        >
                            {footer}
                        </Box>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}
