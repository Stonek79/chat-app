'use client';

import { MouseEvent,useState } from 'react';
import { useRouter } from 'next/navigation';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import {
    AppBar,
    Avatar,
    Box,
    IconButton,
    Menu,
    MenuItem,
    Toolbar,
    Typography,
} from '@mui/material';

import { CHAT_PAGE_ROUTE } from '@/constants';

interface ChatHeaderProps {
    chatName: string;
    chatAvatarUrl?: string | null;
    status: string; // Например, "в сети" или "5 участников"
}

export const ChatHeader = ({ chatName, chatAvatarUrl, status }: ChatHeaderProps) => {
    const router = useRouter();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const handleMenu = (event: MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleGoBack = () => {
        router.push(CHAT_PAGE_ROUTE);
    };

    return (
        <AppBar position="static" color="default" elevation={1}>
            <Toolbar>
                <IconButton
                    edge="start"
                    color="inherit"
                    aria-label="назад"
                    onClick={handleGoBack}
                    sx={{ mr: 1, display: { lg: 'none' } }} // Показываем только на мобильных
                >
                    <ArrowBackIcon />
                </IconButton>
                <Avatar src={chatAvatarUrl || undefined} sx={{ mr: 2 }}>
                    {chatName ? chatName.charAt(0).toUpperCase() : '?'}
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="subtitle1" component="div" sx={{ lineHeight: 1.2 }}>
                        {chatName}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1.2 }}>
                        {status}
                    </Typography>
                </Box>
                <IconButton
                    edge="end"
                    color="inherit"
                    aria-label="меню действий"
                    onClick={handleMenu}
                >
                    <MoreVertIcon />
                </IconButton>
                <Menu
                    id="menu-appbar"
                    anchorEl={anchorEl}
                    anchorOrigin={{
                        vertical: 'top',
                        horizontal: 'right',
                    }}
                    keepMounted
                    transformOrigin={{
                        vertical: 'top',
                        horizontal: 'right',
                    }}
                    open={open}
                    onClose={handleClose}
                >
                    {/* TODO: Добавить реальные действия */}
                    <MenuItem onClick={handleClose}>Поиск по чату</MenuItem>
                    <MenuItem onClick={handleClose}>Информация</MenuItem>
                    <MenuItem onClick={handleClose} sx={{ color: 'error.main' }}>
                        Выйти из чата
                    </MenuItem>
                </Menu>
            </Toolbar>
        </AppBar>
    );
};
