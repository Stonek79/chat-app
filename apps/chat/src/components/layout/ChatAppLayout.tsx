'use client';

import { ReactNode, useEffect, useState, MouseEvent } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { ChatWithDetails, MessagePayload } from '@chat-app/core';
import { CHAT_PAGE_ROUTE, convertMessagePayloadToDisplayMessage } from '@chat-app/core';
import {
    SERVER_EVENT_CHAT_CREATED,
    SERVER_EVENT_RECEIVE_MESSAGE,
    getSocket,
} from '@chat-app/socket-shared';
import AddIcon from '@mui/icons-material/Add';
import { Fab, Menu, MenuItem } from '@mui/material';
import Box from '@mui/material/Box';

import { Sidebar } from '@/components';
import { useAuth, useMobile } from '@/hooks';
import useChatStore from '@/store/chatStore';

interface AdaptiveChatLayoutProps {
    children: ReactNode;
}

const sidebarWidth = 320;

/**
 * Адаптивный макет для раздела чатов.
 * - На десктопе: показывает двухпанельный интерфейс (список чатов + активный чат).
 * - На мобильных: показывает либо список чатов, либо активный чат.
 */
export function ChatAppLayout({ children }: AdaptiveChatLayoutProps) {
    const isMobile = useMobile();
    const { user } = useAuth();
    const { addChat, updateLastMessage, incrementUnreadCount, fetchChats } = useChatStore();
    const pathname = usePathname();
    const router = useRouter();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    const handleMenuOpen = (event: MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleCreateGroup = () => {
        console.log('Create group chat from FAB');
        handleMenuClose();
    };

    const handleCreateDirect = () => {
        console.log('Create direct chat from FAB');
        handleMenuClose();
    };

    const handleChatSelect = (chatId: string) => {
        router.push(`${CHAT_PAGE_ROUTE}/${chatId}`);
    };

    useEffect(() => {
        if (!user) return;

        // Загружаем чаты один раз при аутентификации пользователя
        fetchChats();

        const socket = getSocket();

        const handleNewChat = (chat: ChatWithDetails) => {
            addChat(chat);
        };

        const handleNewMessage = (payload: MessagePayload) => {
            const message = convertMessagePayloadToDisplayMessage(payload, user.id);
            // Не увеличиваем счетчик, если мы уже в этом чате
            if (pathname !== `${CHAT_PAGE_ROUTE}/${message.chatId}`) {
                incrementUnreadCount(message.chatId);
            }
            updateLastMessage(message.chatId, message);
        };

        socket.on(SERVER_EVENT_CHAT_CREATED, handleNewChat);
        socket.on(SERVER_EVENT_RECEIVE_MESSAGE, handleNewMessage);

        return () => {
            socket.off(SERVER_EVENT_CHAT_CREATED, handleNewChat);
            socket.off(SERVER_EVENT_RECEIVE_MESSAGE, handleNewMessage);
        };
    }, [user, addChat, updateLastMessage, incrementUnreadCount, pathname, fetchChats]);

    if (!user) {
        return null;
    }

    const isChatRootPage = pathname === CHAT_PAGE_ROUTE;

    // На мобильных устройствах мы показываем либо список чатов (Sidebar), либо сам чат (children)
    if (isMobile) {
        return (
            <>
                {isChatRootPage ? (
                    <Sidebar
                        currentUser={user}
                        isMobile={isMobile}
                        onChatSelect={handleChatSelect}
                    />
                ) : (
                    <>{children}</>
                )}
                {isChatRootPage && (
                    <>
                        <Fab
                            color="primary"
                            aria-label="создать"
                            sx={{ position: 'absolute', bottom: 16, right: 16 }}
                            onClick={handleMenuOpen}
                        >
                            <AddIcon />
                        </Fab>
                        <Menu
                            anchorEl={anchorEl}
                            open={Boolean(anchorEl)}
                            onClose={handleMenuClose}
                            anchorOrigin={{
                                vertical: 'top',
                                horizontal: 'right',
                            }}
                            transformOrigin={{
                                vertical: 'bottom',
                                horizontal: 'right',
                            }}
                        >
                            <MenuItem onClick={handleCreateGroup}>Создать канал</MenuItem>
                            <MenuItem onClick={handleCreateDirect}>Начать переписку</MenuItem>
                        </Menu>
                    </>
                )}
            </>
        );
    }

    // На десктопе всегда отображается двухпанельный макет.
    return (
        <Box sx={{ display: 'flex', height: '100%' }}>
            <Box
                component="aside"
                sx={{
                    width: sidebarWidth,
                    flexShrink: 0,
                    height: '100%',
                    borderRight: '1px solid',
                    borderColor: 'divider',
                }}
            >
                <Sidebar currentUser={user} isMobile={isMobile} onChatSelect={handleChatSelect} />
            </Box>
            <Box component="main" sx={{ flexGrow: 1, height: '100%' }}>
                {children}
            </Box>
        </Box>
    );
}
