'use client';

import { useRouter, usePathname } from 'next/navigation';
import type { AuthenticatedUser } from '@chat-app/core';
import { CHAT_PAGE_ROUTE } from '@chat-app/core';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import { CircularProgress, IconButton, InputBase, Typography } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { ChatList } from '@/components';
import SearchIcon from '@mui/icons-material/Search';
import { UserProfilePanel } from './sidebar/UserProfilePanel';
import useChatStore from '@/store/chatStore';
import { shallow } from 'zustand/shallow';
import MenuItem from '@mui/material/MenuItem';
import Menu from '@mui/material/Menu';
import { useState, useMemo } from 'react';
import { useDebounceValue } from '@/hooks';

const getChatIdFromPathname = (currentPathname: string): string | null => {
    // Убедимся, что CHAT_PAGE_ROUTE оканчивается без слеша для корректного разделения
    const baseRoute = CHAT_PAGE_ROUTE.endsWith('/')
        ? CHAT_PAGE_ROUTE.slice(0, -1)
        : CHAT_PAGE_ROUTE;
    if (currentPathname.startsWith(baseRoute + '/')) {
        const segments = currentPathname.split('/');
        // Индекс сегмента с ID чата зависит от структуры CHAT_PAGE_ROUTE
        // Если CHAT_PAGE_ROUTE = '/chat', то ID будет segments[2]
        // Если CHAT_PAGE_ROUTE = '/main/chat', то ID будет segments[3]
        const baseSegmentsCount = baseRoute.split('/').filter(Boolean).length; // Считаем непустые сегменты в базовом роуте
        const chatId = segments[baseSegmentsCount + 1];
        if (segments.length > baseSegmentsCount + 1 && chatId) {
            return chatId;
        }
    }
    return null;
};

interface SidebarProps {
    currentUser: AuthenticatedUser;
    onChatSelect: (chatId: string) => void;
    onCreateGroup?: () => void;
    onCreateDirect?: () => void;
}

export function Sidebar({
    currentUser,
    onChatSelect,
    onCreateGroup,
    onCreateDirect,
}: SidebarProps) {
    const displayUser = currentUser;
    const router = useRouter();
    const pathname = usePathname();
    const { chats, isLoading, hasMoreChats, isChatsLoadingMore, loadMoreChats } = useChatStore(
        state => ({
            chats: state.chats,
            isLoading: state.isLoading,
            hasMoreChats: state.hasMoreChats,
            isChatsLoadingMore: state.isChatsLoadingMore,
            loadMoreChats: state.loadMoreChats,
        }),
        shallow
    );
    const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearchQuery = useDebounceValue(searchQuery, 300);

    const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
        setMenuAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setMenuAnchorEl(null);
    };

    const handleCreateGroup = () => {
        handleMenuClose();
        onCreateGroup?.();
    };

    const handleCreateDirect = () => {
        handleMenuClose();
        onCreateDirect?.();
    };
    if (isLoading) {
        return <CircularProgress />;
    }

    // ID активного чата теперь просто вычисляется из URL.
    // Больше нет необходимости в useState и useEffect для синхронизации.
    const selectedChatId = getChatIdFromPathname(pathname);

    // Фильтрация чатов по поисковому запросу
    const filteredChats = useMemo(() => {
        if (!debouncedSearchQuery.trim()) {
            return chats;
        }

        const query = debouncedSearchQuery.toLowerCase();
        return chats.filter(chat => {
            const nameMatch = chat.name?.toLowerCase().includes(query);
            const lastMessageMatch = chat.lastMessage?.content.toLowerCase().includes(query);
            return nameMatch || lastMessageMatch;
        });
    }, [chats, debouncedSearchQuery]);

    const handleChatSelect = (chatId: string) => {
        // Просто переходим по новому маршруту.
        // Состояние обновится автоматически, так как изменится `pathname`.
        router.push(`${CHAT_PAGE_ROUTE}/${chatId}`);
    };

    return (
        <Paper
            elevation={0}
            component="aside"
            sx={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                p: 0,
                flexShrink: 0,
                backgroundColor: 'background.paper',
            }}
        >
            <Typography variant="h6" sx={{ p: 2, textAlign: 'center' }}>
                Чаты
            </Typography>
            <Box
                sx={{
                    p: 1,
                    display: 'flex',
                    alignItems: 'center',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                }}
            >
                <IconButton onClick={handleMenuOpen}>
                    <MenuIcon  />
                </IconButton>
                <Box
                    sx={{
                        ml: 2,
                        flex: 1,
                        backgroundColor: 'background.default',
                        borderRadius: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        p: '2px 8px',
                    }}
                >
                    <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
                    <InputBase
                        fullWidth
                        placeholder="Поиск чатов..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        sx={{ color: 'text.primary' }}
                    />
                </Box>
            </Box>
            <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
                <ChatList
                    chats={filteredChats}
                    activeChatId={selectedChatId}
                    onChatSelect={onChatSelect}
                    hasMore={hasMoreChats}
                    isLoadingMore={isChatsLoadingMore}
                    onLoadMore={loadMoreChats}
                />
            </Box>
            <UserProfilePanel user={displayUser} />
            <Menu
                anchorEl={menuAnchorEl}
                open={Boolean(menuAnchorEl)}
                onClose={handleMenuClose}
            >
                <MenuItem onClick={handleCreateGroup}>Создать канал</MenuItem>
                <MenuItem onClick={handleCreateDirect}>Начать переписку</MenuItem>
            </Menu>
        </Paper>
    );
}
