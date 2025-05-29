import { ErrorBoundary, Sidebar } from '@/components';
import { ReactNode, Suspense } from 'react';
import { LOGIN_PAGE_ROUTE } from '@/constants';
import { getCurrentUserFromSessionCookie } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { Box, CircularProgress, Typography } from '@mui/material';
import { fetchChatsForLayout } from '@/lib/fetch';

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
                        height: '100vh',
                    }}
                >
                    <CircularProgress />
                </Box>
            }
        >
            <ErrorBoundary fallback={<ErrorFallback />}>
                <Sidebar
                    initialUser={currentUser}
                    chats={chats}
                >
                    {children}
                </Sidebar>
            </ErrorBoundary>
        </Suspense>
    );
}
