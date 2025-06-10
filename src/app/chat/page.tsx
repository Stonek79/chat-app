'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { CHAT_PAGE_ROUTE } from '@/constants';
import { fetchChatsForLayout } from '@/lib';
import { Box, CircularProgress } from '@mui/material';
import { Sidebar } from '@/components';
import { useAuth } from '@/hooks';
import { ClientChat } from '@/types';

/**
 * Клиентский компонент, который решает, что делать на маршруте /chat:
 * - На десктопе: перенаправляет на первый доступный чат.
 * - На мобильном: ничего не делает, позволяя родительскому компоненту отрендерить список чатов.
 */
const DesktopRedirect = ({ chats }: { chats: ClientChat[] }) => {
    const router = useRouter();
    const theme = useTheme();
    const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));

    useEffect(() => {
        if (isDesktop && chats.length > 0) {
            router.replace(`${CHAT_PAGE_ROUTE}/${chats[0].id}`);
        }
    }, [isDesktop, chats, router]);

    // На мобильном или если нет чатов, ничего не рендерим,
    // пусть рендерится список чатов из родительского компонента.
    return null;
};

/**
 * Страница, отображаемая по маршруту /chat.
 * - На мобильных устройствах она показывает список чатов.
 * - На десктопах она содержит логику для перенаправления на первый чат.
 */
export default function ChatsRootPage() {
    const [chats, setChats] = useState<ClientChat[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    useEffect(() => {
        fetchChatsForLayout()
            .then(data => {
                setChats(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    if (loading || !user) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100vh',
                }}
            >
                <CircularProgress />
            </Box>
        );
    }

    return (
        <>
            <DesktopRedirect chats={chats} />
            <Box sx={{ height: '100vh', display: { lg: 'none' } }}>
                {/* Этот Sidebar будет виден только на мобильных устройствах */}
                <Sidebar initialUser={user} chats={chats} />
            </Box>
        </>
    );
}
