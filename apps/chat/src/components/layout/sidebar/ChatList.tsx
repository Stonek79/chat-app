'use client';

import { List, ListItemAvatar, Avatar, ListItemText, Typography, Box, Badge, CircularProgress } from '@mui/material';
import type { ChatListItem } from '@chat-app/core';
import { formatTimestamp } from '@/utils';
import { useEffect, useRef } from 'react';

interface ChatListProps {
    chats: ChatListItem[];
    activeChatId: string | null;
    onChatSelect: (chatId: string) => void;
    hasMore: boolean;
    isLoadingMore: boolean;
    onLoadMore: () => void;
}

export const ChatList = ({
    chats,
    activeChatId,
    onChatSelect,
    hasMore,
    isLoadingMore,
    onLoadMore,
}: ChatListProps) => {
    const observerTarget = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0]?.isIntersecting && hasMore && !isLoadingMore) {
                    onLoadMore();
                }
            },
            { threshold: 0.1 }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => observer.disconnect();
    }, [hasMore, isLoadingMore, onLoadMore]);

    return (
        <List sx={{ p: 1 }}>
            {chats.map(chat => {
                const isActive = activeChatId === chat.id;
                const lastMessageText = chat.lastMessage
                    ? `${
                          chat.isGroupChat && chat.lastMessage.sender
                              ? `${chat.lastMessage.sender.username}: `
                              : ''
                      }${chat.lastMessage.content}`
                    : 'Нет сообщений';

                return (
                    <Box
                        key={chat.id}
                        onClick={() => onChatSelect(chat.id)}
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            p: 1,
                            borderRadius: 2,
                            cursor: 'pointer',
                            backgroundColor: isActive ? 'action.selected' : 'transparent',
                            '&:hover': {
                                backgroundColor: 'action.hover',
                            },
                        }}
                    >
                        <ListItemAvatar>
                            <Avatar src={chat.avatarUrl || undefined} />
                        </ListItemAvatar>
                        <ListItemText
                            primary={chat.name}
                            secondary={lastMessageText}
                            slotProps={
                                {
                                    primary: {
                                        noWrap: true,
                                        sx: { color: 'text.primary', fontWeight: 500 },
                                    },
                                    secondary: {
                                        noWrap: true,
                                        sx: { color: 'text.secondary' },
                                    },
                                }
                            }
                        />
                        <Box sx={{ ml: 1, textAlign: 'right', minWidth: '50px' }}>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                {chat.lastMessage
                                    ? formatTimestamp(chat.lastMessage.updatedAt)
                                    : ''}
                            </Typography>
                            <Box sx={{ mt: 0.5, height: 20 }}>
                                {chat.unreadCount > 0 && (
                                    <Badge
                                        badgeContent={chat.unreadCount}
                                        color={isActive ? 'default' : 'primary'}
                                        sx={{
                                            '& .MuiBadge-badge': {
                                                color: isActive ? 'text.primary' : 'white',
                                                backgroundColor: isActive
                                                    ? 'transparent'
                                                    : 'primary.main',
                                            },
                                        }}
                                    />
                                )}
                            </Box>
                        </Box>
                    </Box>
                );
            })}
            
            {/* Sentinel for Infinite Scroll */}
            {(hasMore || isLoadingMore) && (
                <Box
                    ref={observerTarget}
                    sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        p: 1,
                        minHeight: '40px',
                    }}
                >
                    {isLoadingMore && <CircularProgress size={24} />}
                </Box>
            )}
        </List>
    );
};
