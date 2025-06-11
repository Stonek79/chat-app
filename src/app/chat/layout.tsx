import { ReactNode, Suspense } from 'react';
import { redirect } from 'next/navigation';
import { Box, CircularProgress, Typography } from '@mui/material';

import { ErrorBoundary } from '@/components';
import { ChatAppLayout } from '@/components';
import { LOGIN_PAGE_ROUTE } from '@/constants';
import { fetchChatsForLayout,getCurrentUserFromSessionCookie } from '@/lib';

const ErrorFallback = ({ error }: { error?: Error }) => (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography color="error">
            Произошла ошибка при загрузке чатов: {error?.message || 'Неизвестная ошибка'}
        </Typography>
    </Box>
);

export default async function ChatLayout({ children }: { children: ReactNode }) {
    const currentUser = await getCurrentUserFromSessionCookie();
    if (!currentUser) {
        redirect(LOGIN_PAGE_ROUTE);
    }

    const chats = await fetchChatsForLayout();

    return (
        <Suspense
            fallback={
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
            }
        >
            <ErrorBoundary fallback={<ErrorFallback />}>
                <ChatAppLayout currentUser={currentUser} chats={chats}>
                    {children}
                </ChatAppLayout>
            </ErrorBoundary>
        </Suspense>
    );
}
