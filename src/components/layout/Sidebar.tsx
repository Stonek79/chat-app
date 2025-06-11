'use client';

import { ReactNode } from 'react';
import { usePathname,useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';

import { CHAT_PAGE_ROUTE } from '@/constants';
import { AuthenticatedUser, ClientChat,ClientUser } from '@/types';

import { ChatListSection } from './sidebar/ChatListSection';
import { LogoutButtonSection } from './sidebar/LogoutButtonSection';
import { UserProfilePanel } from './sidebar/UserProfilePanel';

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

interface SidebarProps {
    initialUser: AuthenticatedUser;
    children?: ReactNode;
    chats: ClientChat[];
}

export function Sidebar({ initialUser, children, chats }: SidebarProps) {
    const displayUser = initialUser;
    const router = useRouter();
    const pathname = usePathname();

    // ID активного чата теперь просто вычисляется из URL.
    // Больше нет необходимости в useState и useEffect для синхронизации.
    const selectedChatId = getChatIdFromPathname(pathname);

    const handleChatSelect = (chatId: string) => {
        // Просто переходим по новому маршруту.
        // Состояние обновится автоматически, так как изменится `pathname`.
        router.push(`${CHAT_PAGE_ROUTE}/${chatId}`);
    };

    // TODO: Реализовать модальные окна для создания каналов/ЛС
    const handleAddChannel = () => console.log('Add channel clicked');
    const handleAddDirectMessage = () => console.log('Add direct message clicked');

    const groupChannels = chats.filter(chat => chat.isGroupChat);
    const directMessages = chats.filter(chat => !chat.isGroupChat);

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
                    />
                </Box>
                <LogoutButtonSection />
            </Paper>
            <Box
                sx={{
                    flexGrow: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    overflow: 'auto',
                }}
            >
                {children}
            </Box>
        </Box>
    );
}
