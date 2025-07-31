'use client';

import { MouseEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CHAT_PAGE_ROUTE } from '@chat-app/core';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PhoneIcon from '@mui/icons-material/Phone';
import SearchIcon from '@mui/icons-material/Search';
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
        <AppBar
            position="static"
            color="transparent"
            elevation={0}
            sx={{
                borderBottom: '1px solid',
                borderColor: 'divider',
                backgroundColor: 'background.paper',
            }}
        >
            <Toolbar sx={{ minHeight: 'sm' }}>
                {' '}
                {/* TODO: fix interface */}
                <IconButton
                    edge="start"
                    color="inherit"
                    aria-label="назад"
                    onClick={handleGoBack}
                    sx={{ mr: 1, display: { md: 'none' } }} // Скрываем только на больших экранах
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
                <Box>
                    <IconButton color="inherit" sx={{ color: 'text.secondary' }}>
                        <PhoneIcon />
                    </IconButton>
                    <IconButton color="inherit" sx={{ color: 'text.secondary' }}>
                        <SearchIcon />
                    </IconButton>
                    <IconButton color="inherit" sx={{ color: 'text.secondary' }}>
                        <MoreVertIcon />
                    </IconButton>
                </Box>
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
