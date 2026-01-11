'use client';

import { ReactNode, useEffect, useState, MouseEvent, useMemo, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { ChatWithDetails, MessagePayload } from '@chat-app/core';
import {
    CHAT_PAGE_ROUTE,
    convertMessagePayloadToDisplayMessage,
    LOGIN_PAGE_ROUTE,
    REGISTER_PAGE_ROUTE,
} from '@chat-app/core';
import { HOME_PAGE_ROUTE } from '@chat-app/core';
import {
    SERVER_EVENT_CHAT_CREATED,
    SERVER_EVENT_RECEIVE_MESSAGE,
    getSocket,
} from '@chat-app/socket-shared';
import AddIcon from '@mui/icons-material/Add';
import { Box, CircularProgress, Fab, Menu, MenuItem } from '@mui/material';
import { Sidebar, CreateGroupDialog, CreatePrivateChatDialog } from '@/components';
import { useMobile } from '@/hooks';
import useChatStore from '@/store/chatStore';
import { shallow } from 'zustand/vanilla/shallow';

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
    const { user, isLoading } = useChatStore(
        state => ({ user: state.currentUser, isLoading: state.isLoading }),
        shallow
    );
    const pathname = usePathname();
    const router = useRouter();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [createGroupDialogOpen, setCreateGroupDialogOpen] = useState(false);
    const [createPrivateChatDialogOpen, setCreatePrivateChatDialogOpen] = useState(false);
    const { addChat, updateLastMessage, incrementUnreadCount } = useChatStore(
        state => ({
            addChat: state.addChat,
            updateLastMessage: state.updateLastMessage,
            incrementUnreadCount: state.incrementUnreadCount,
        }),
        shallow
    );

    const publicRoutes = useMemo(
        () => [LOGIN_PAGE_ROUTE, REGISTER_PAGE_ROUTE, HOME_PAGE_ROUTE],
        []
    );

    useEffect(() => {
        if (isLoading) return; // Ждем окончания загрузки данных о пользователе

        const isPublicRoute = publicRoutes.includes(pathname);
        const isAuthenticated = !!user;

        if (!isAuthenticated && !isPublicRoute) {
            router.push(LOGIN_PAGE_ROUTE);
        } else if (isAuthenticated && isPublicRoute) {
            router.push(CHAT_PAGE_ROUTE);
        }
    }, [user, isLoading, pathname, router, publicRoutes]);

    useEffect(() => {
        if (!user || isLoading) {
            return;
        }

        const socket = getSocket();

        const handleNewChat = (chat: ChatWithDetails) => {
            addChat(chat);
        };

        const handleNewMessage = (payload: MessagePayload) => {
            // Проверяем, что чат, к которому пришло сообщение, не является текущим открытым
            const currentChatId = pathname.split('/').pop();
            if (payload.chatId !== currentChatId) {
                incrementUnreadCount(payload.chatId);
            }
            // Обновляем последнее сообщение всегда
            updateLastMessage(
                payload.chatId,
                convertMessagePayloadToDisplayMessage(payload, user.id)
            );
        };
        socket.on(SERVER_EVENT_CHAT_CREATED, handleNewChat);
        socket.on(SERVER_EVENT_RECEIVE_MESSAGE, handleNewMessage);

        return () => {
            socket.off(SERVER_EVENT_CHAT_CREATED, handleNewChat);
            socket.off(SERVER_EVENT_RECEIVE_MESSAGE, handleNewMessage);
        };
    }, [user, addChat, updateLastMessage, incrementUnreadCount, pathname]);

    const handleMenuOpen = useCallback((event: MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    }, []);

    const handleMenuClose = useCallback(() => {
        setAnchorEl(null);
    }, []);

    const handleCreateGroup = useCallback(() => {
        handleMenuClose();
        setCreateGroupDialogOpen(true);
    }, [handleMenuClose]);

    const handleCreateDirect = useCallback(() => {
        handleMenuClose();
        setCreatePrivateChatDialogOpen(true);
    }, [handleMenuClose]);

    const handleChatSelect = useCallback(
        (chatId: string) => {
            router.push(`${CHAT_PAGE_ROUTE}/${chatId}`);
        },
        [router]
    );

    if (isLoading) {
        // Пока идет проверка, показываем лоадер
        return (
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100%',
                }}
            >
                <CircularProgress />
            </Box>
        );
    }

    const isChatRootPage = pathname === CHAT_PAGE_ROUTE;

    const isPublicRoute = publicRoutes.includes(pathname);

    // Если мы на публичном роуте и не залогинены, показываем children (LoginForm)
    if (!user && isPublicRoute) {
        return <>{children}</>;
    }

    // Если не залогинены и на приватном роуте, редирект уже сработал, ничего не рендерим
    if (!user && !isPublicRoute) {
        return null;
    }

    if (!user) return null; // Формальная проверка для TypeScript, хотя логически сюда не попадем

    // На мобильных устройствах мы показываем либо список чатов (Sidebar), либо сам чат (children)
    if (isMobile) {
        return (
            <>
                {isChatRootPage ? (
                    <Sidebar
                        currentUser={user}
                        onChatSelect={handleChatSelect}
                        onCreateGroup={handleCreateGroup}
                        onCreateDirect={handleCreateDirect}
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
                <CreateGroupDialog
                    open={createGroupDialogOpen}
                    onClose={() => setCreateGroupDialogOpen(false)}
                />
                <CreatePrivateChatDialog
                    open={createPrivateChatDialogOpen}
                    onClose={() => setCreatePrivateChatDialogOpen(false)}
                />
            </>
        );
    }

    // На десктопе всегда отображается двухпанельный макет.
    return (
        <>
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
                    <Sidebar
                        currentUser={user}
                        onChatSelect={handleChatSelect}
                        onCreateGroup={handleCreateGroup}
                        onCreateDirect={handleCreateDirect}
                    />
                </Box>
                <Box component="main" sx={{ flexGrow: 1, height: '100%', position: 'relative' }}>
                    {children}
                    {isChatRootPage && (
                        <Fab
                            color="primary"
                            aria-label="создать"
                            sx={{ position: 'absolute', bottom: 24, right: 24 }}
                            onClick={handleMenuOpen}
                        >
                            <AddIcon />
                        </Fab>
                    )}
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
                </Box>
            </Box>
            <CreateGroupDialog
                open={createGroupDialogOpen}
                onClose={() => setCreateGroupDialogOpen(false)}
            />
            <CreatePrivateChatDialog
                open={createPrivateChatDialogOpen}
                onClose={() => setCreatePrivateChatDialogOpen(false)}
            />
        </>
    );
}
