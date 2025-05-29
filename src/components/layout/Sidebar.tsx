'use client';

import { useState, ReactNode, useEffect } from 'react';
import { ClientUser, ClientChat } from '@/types';
import Paper from '@mui/material/Paper';
import { UserProfilePanel } from './sidebar/UserProfilePanel';
import { ChatListSection } from './sidebar/ChatListSection';
import { LogoutButtonSection } from './sidebar/LogoutButtonSection';
import Box from '@mui/material/Box';
import { useRouter, usePathname } from 'next/navigation';
import { CHAT_PAGE_ROUTE } from '@/constants';

interface SidebarProps {
    initialUser: ClientUser;
    chats: ClientChat[];
    children: ReactNode;
}

export function Sidebar({ initialUser, chats, children }: SidebarProps) {
    const displayUser = initialUser;
    const router = useRouter();
    const pathname = usePathname();

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
            if (segments.length > baseSegmentsCount + 1 && segments[baseSegmentsCount + 1]) {
                return segments[baseSegmentsCount + 1];
            }
        }
        return null;
    };

    const [selectedChatId, setSelectedChatId] = useState<string | null>(() => {
        const chatIdFromUrl = getChatIdFromPathname(pathname);
        return chatIdFromUrl || chats[0]?.id || null;
    });

    useEffect(() => {
        const chatIdFromUrl = getChatIdFromPathname(pathname);

        if (chatIdFromUrl) {
            // Мы на странице конкретного чата (например, /chat/some-id)
            // Синхронизируем selectedChatId с URL
            if (chatIdFromUrl !== selectedChatId) {
                setSelectedChatId(chatIdFromUrl);
            }
        } else {
            // Мы не на странице конкретного чата (например, /chat или /chat/)
            // Проверяем, является ли текущий путь базовой страницей чатов
            if (pathname === CHAT_PAGE_ROUTE || pathname === `${CHAT_PAGE_ROUTE}/`) {
                if (chats.length > 0) {
                    const firstChatId = chats[0].id;
                    // Перенаправляем на первый чат
                    router.push(`${CHAT_PAGE_ROUTE}/${firstChatId}`);
                    // selectedChatId обновится автоматически при следующем запуске useEffect
                    // после изменения pathname
                } else {
                    // На странице /chat нет чатов, убедимся, что selectedChatId сброшен
                    if (selectedChatId !== null) {
                        setSelectedChatId(null);
                    }
                }
            }
            // Можно добавить обработку других путей без chatId, если это необходимо
            // например, если Sidebar используется в других частях приложения
        }
    }, [pathname, chats, router, selectedChatId, CHAT_PAGE_ROUTE]);

    const handleChatSelect = (chatId: string) => {
        // Обновление selectedChatId произойдет через useEffect после изменения pathname
        if (
            chatId !== selectedChatId ||
            pathname === CHAT_PAGE_ROUTE ||
            pathname === `${CHAT_PAGE_ROUTE}/`
        ) {
            router.push(`${CHAT_PAGE_ROUTE}/${chatId}`);
        }
    };

    // TODO: Реализовать модальные окна для создания каналов/ЛС
    const handleAddChannel = () => console.log('Add channel clicked');
    const handleAddDirectMessage = () => console.log('Add direct message clicked');

    const groupChannels = chats.filter(chat => chat.isGroupChat);
    const directMessages = chats.filter(chat => !chat.isGroupChat);
    console.log('directMessages', directMessages);

    return (
        <Box sx={{ display: 'flex', width: '100%', height: '100%', overflow: 'hidden' }}>
            <Paper
                elevation={3}
                sx={{
                    width: { xs: '100%', sm: 260, md: 280 },
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRight: '1px solid',
                    borderColor: 'divider',
                    p: 0,
                }}
            >
                <UserProfilePanel user={displayUser} />

                <Box width="100%" height="100%">
                    <ChatListSection
                        title="КАНАЛЫ"
                        chats={groupChannels}
                        selectedChatId={selectedChatId}
                        onChatSelect={handleChatSelect}
                        onAddChat={handleAddChannel}
                        addChatButtonText="Добавить канал"
                    />

                    <ChatListSection
                        title="ЛИЧНЫЕ СООБЩЕНИЯ"
                        chats={directMessages}
                        selectedChatId={selectedChatId}
                        onChatSelect={handleChatSelect}
                        onAddChat={handleAddDirectMessage}
                        addChatButtonText="Начать переписку"
                        isDirectMessages={true}
                    />
                </Box>
                <LogoutButtonSection />
            </Paper>
            <Box
                sx={{
                    flexGrow: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100vh',
                    overflow: 'auto',
                }}
            >
                {children}
            </Box>
        </Box>
    );
}
