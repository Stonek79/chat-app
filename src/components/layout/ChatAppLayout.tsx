'use client';

import { ReactNode } from 'react';
import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

import { Sidebar } from '@/components';
import { AuthenticatedUser, ClientChat } from '@/types';

interface AdaptiveChatLayoutProps {
    children: ReactNode;
    currentUser: AuthenticatedUser;
    chats: ClientChat[];
}

const sidebarWidth = 320;

/**
 * Адаптивный макет для раздела чатов.
 * - На десктопе: показывает двухпанельный интерфейс (список чатов + активный чат).
 * - На мобильных: показывает только один полноэкранный компонент (children).
 */
export function ChatAppLayout({ children, currentUser, chats }: AdaptiveChatLayoutProps) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('lg'));

    if (isMobile) {
        // На мобильных устройствах макет просто отображает дочерний компонент на весь экран.
        // Логика того, ЧТО отображать (список или чат), определяется маршрутизацией Next.js.
        return <>{children}</>;
    }

    // На десктопе всегда отображается двухпанельный макет.
    return (
        <Box sx={{ display: 'flex', height: '100vh' }}>
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
                {/* Здесь мы передаем children в Sidebar, чтобы он мог рендерить свою шапку */}
                <Sidebar initialUser={currentUser} chats={chats} />
            </Box>

            <Box sx={{ flexGrow: 1, height: '100%' }}>{children}</Box>
        </Box>
    );
}
