'use client';

import { useMemo, useState, MouseEvent } from 'react';
import useChatStore from '@/store/chatStore';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { Badge, CircularProgress, ListItemAvatar, Menu, MenuItem } from '@mui/material';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import Typography from '@mui/material/Typography';
import { formatTimestamp } from '@/utils';

interface ChatListSectionProps {
    title: string;
    selectedChatId: string | null;
    onChatSelect: (chatId: string) => void;
    filter: 'group' | 'direct' | 'all';
}

export function ChatListSection({
    title,
    selectedChatId,
    onChatSelect,
    filter,
}: ChatListSectionProps) {
    const { chats, isLoading, error } = useChatStore();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    const handleMenuOpen = (event: MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleCreateGroup = () => {
        console.log('Create group chat');
        handleMenuClose();
    };

    const handleCreateDirect = () => {
        console.log('Create direct chat');
        handleMenuClose();
    };

    const filteredChats = useMemo(() => {
        if (filter === 'all') {
            return chats;
        }
        if (filter === 'group') {
            return chats.filter(chat => chat.isGroupChat);
        }
        return chats.filter(chat => !chat.isGroupChat);
    }, [chats, filter]);

    const renderContent = () => {
        if (isLoading) {
            return (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                </Box>
            );
        }

        if (error) {
            return (
                <Typography variant="body2" color="error" sx={{ p: 2, textAlign: 'center' }}>
                    {error}
                </Typography>
            );
        }

        if (filteredChats.length === 0) {
            return (
                <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ p: 2, textAlign: 'center' }}
                >
                    Список пуст
                </Typography>
            );
        }

        return filteredChats.map(chat => (
            <ListItemButton
                key={chat.id}
                selected={chat.id === selectedChatId}
                onClick={() => onChatSelect(chat.id)}
                sx={{ borderRadius: 2, mb: 1 }}
                alignItems="flex-start"
            >
                <ListItemAvatar>
                    <Avatar src={chat.avatarUrl || undefined}>
                        {chat.name ? chat.name.charAt(0).toUpperCase() : 'Ч'}
                    </Avatar>
                </ListItemAvatar>
                <ListItemText
                    primary={chat.name || 'Безымянный чат'}
                    secondary={chat.lastMessage?.content || 'Нет сообщений'}
                    slotProps={{
                        primary: {
                            noWrap: true,
                            sx: { fontWeight: 500 },
                        },
                        secondary: {
                            noWrap: true,
                            sx: { color: 'text.secondary' },
                        },
                    }}
                    sx={{ mr: 1 }}
                />
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-end',
                        ml: 'auto',
                        pl: 1,
                    }}
                >
                    <Typography variant="caption" color="text.secondary" noWrap>
                        {formatTimestamp(chat?.lastMessage?.createdAt)}
                    </Typography>
                    {chat.unreadCount && chat.unreadCount > 0 ? (
                        <Badge badgeContent={chat.unreadCount} color="primary" sx={{ mt: 0.5 }} />
                    ) : (
                        <Box sx={{ height: 20 }} /> // Заглушка для выравнивания
                    )}
                </Box>
            </ListItemButton>
        ));
    };

    return (
        <List
            sx={{
                height: 'calc(50% - 40px)',
                overflowY: 'auto',
                p: 1,
            }}
            subheader={
                <ListSubheader sx={{ bgcolor: 'background.paper', lineHeight: '30px' }}>
                    {title}
                </ListSubheader>
            }
        >
            {renderContent()}
            <Button
                variant="text"
                startIcon={<AddCircleOutlineIcon />}
                onClick={handleMenuOpen}
                sx={{
                    justifyContent: 'flex-start',
                    width: '100%',
                    textTransform: 'none',
                    p: 1.5,
                }}
            >
                Создать...
            </Button>
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                }}
            >
                <MenuItem onClick={handleCreateGroup}>Создать канал</MenuItem>
                <MenuItem onClick={handleCreateDirect}>Начать переписку</MenuItem>
            </Menu>
        </List>
    );
}
