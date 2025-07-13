'use client';

import { List, ListItemAvatar, Avatar, ListItemText, Typography, Box, Badge } from '@mui/material';
import type { ChatListItem } from '@chat-app/core';
import { formatTimestamp } from '@/utils';

interface ChatListProps {
    chats: ChatListItem[];
    activeChatId: string | null;
    onChatSelect: (chatId: string) => void;
}

export const ChatList = ({ chats, activeChatId, onChatSelect }: ChatListProps) => {
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
                            primaryTypographyProps={{
                                noWrap: true,
                                sx: { color: 'text.primary', fontWeight: 500 },
                            }}
                            secondaryTypographyProps={{
                                noWrap: true,
                                sx: { color: 'text.secondary' },
                            }}
                        />
                        <Box sx={{ ml: 1, textAlign: 'right', minWidth: '50px' }}>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                {chat.lastMessage
                                    ? formatTimestamp(chat.lastMessage.createdAt)
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
        </List>
    );
};
