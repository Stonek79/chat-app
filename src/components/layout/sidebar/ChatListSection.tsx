'use client';

import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { Badge,ListItemAvatar } from '@mui/material';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import Typography from '@mui/material/Typography';

import { ClientChat } from '@/types';

// TODO: Заменить на реальный тип, когда он будет доступен с бекенда
// interface EnrichedClientChat extends ClientChat {
//     lastMessage?: {
//         text: string;
//         timestamp: string; // ISO-строка
//     };
//     unreadCount?: number;
// }

// Вспомогательная функция для форматирования времени
const formatTimestamp = (timestamp: string | undefined | Date) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
};

interface ChatListSectionProps {
    title: string;
    chats: ClientChat[];
    selectedChatId: string | null;
    onChatSelect: (chatId: string) => void;
    onAddChat: () => void;
    addChatButtonText: string;
}

export function ChatListSection({
    title,
    chats,
    selectedChatId,
    onChatSelect,
    onAddChat,
    addChatButtonText,
}: ChatListSectionProps) {
    return (
        <List
            sx={{
                height: 'calc(50% - 40px)', // Оставляем место для кнопки
                overflowY: 'auto',
                p: 1,
            }}
            subheader={
                <ListSubheader sx={{ bgcolor: 'background.paper', lineHeight: '30px' }}>
                    {title}
                </ListSubheader>
            }
        >
            {chats.length > 0 ? (
                chats.map(chat => (
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
                            primaryTypographyProps={{
                                noWrap: true,
                                sx: { fontWeight: 500 },
                            }}
                            secondaryTypographyProps={{
                                noWrap: true,
                                sx: { color: 'text.secondary' },
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
                                <Badge
                                    badgeContent={chat.unreadCount}
                                    color="primary"
                                    sx={{ mt: 0.5 }}
                                />
                            ) : (
                                <Box sx={{ height: 20 }} /> // Заглушка для выравнивания
                            )}
                        </Box>
                    </ListItemButton>
                ))
            ) : (
                <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ p: 2, textAlign: 'center' }}
                >
                    Список чатов пуст
                </Typography>
            )}

            <Button
                variant="text"
                startIcon={<AddCircleOutlineIcon />}
                onClick={onAddChat}
                sx={{
                    justifyContent: 'flex-start',
                    width: '100%',
                    textTransform: 'none',
                    p: 1.5,
                }}
            >
                {addChatButtonText}
            </Button>
        </List>
    );
}
