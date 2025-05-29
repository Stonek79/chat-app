'use client';

import { ClientChat } from '@/types';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import Box from '@mui/material/Box';

interface ChatListSectionProps {
    title: string;
    chats: ClientChat[];
    selectedChatId: string | null;
    onChatSelect: (chatId: string) => void;
    onAddChat: () => void;
    addChatButtonText: string;
    isDirectMessages?: boolean;
    listSx?: object;
}

export function ChatListSection({
    title,
    chats,
    selectedChatId,
    onChatSelect,
    onAddChat,
    addChatButtonText,
    isDirectMessages = false,
    listSx = {},
}: ChatListSectionProps) {
    return (
        <List
            sx={{
                justifyContent: 'space-between',
                height: '50%',
                overflowY: 'auto',
                p: 1,
                ...listSx,
            }}
            subheader={
                <ListSubheader sx={{ bgcolor: 'transparent', my: 0.5 }}>
                    {title}
                </ListSubheader>
            }
        >
            <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
                {chats.map(chat => (
                    <ListItemButton
                        key={chat.id}
                        selected={chat.id === selectedChatId}
                        onClick={() => onChatSelect(chat.id)}
                        sx={{ borderRadius: 1, mb: 0.5 }}
                    >
                        {isDirectMessages && (
                            <Avatar
                                sx={{ mr: 1.5, width: 32, height: 32, fontSize: '0.875rem' }}
                                src={chat.avatarUrl || undefined}
                            >
                                {chat.avatarUrl
                                    ? null
                                    : chat.name
                                      ? chat.name.charAt(0).toUpperCase()
                                      : 'Ч'}
                            </Avatar>
                        )}
                        <ListItemText
                            primary={
                                isDirectMessages
                                    ? chat.name || 'Безымянный чат'
                                    : `# ${chat.name || 'Безымянный канал'}`
                            }
                            slotProps={{
                                primary: {
                                    fontWeight: chat.id === selectedChatId ? 'bold' : 'normal',
                                },
                            }}
                        />
                    </ListItemButton>
                ))}
            </Box>
            {chats.length === 0 && (
                <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ p: 1, textAlign: 'center' }}
                >
                    {isDirectMessages ? 'Нет личных сообщений.' : 'Нет доступных каналов.'}
                </Typography>
            )}
            <Button
                variant="text"
                startIcon={<AddCircleOutlineIcon />}
                sx={{
                    mt: 1,
                    justifyContent: 'flex-start',
                    width: '100%',
                    textTransform: 'none',
                    alignSelf: 'flex-end',
                    position: 'absolute',
                    bottom: 0,
                }}
                onClick={onAddChat}
            >
                {addChatButtonText}
            </Button>
        </List>
    );
}
