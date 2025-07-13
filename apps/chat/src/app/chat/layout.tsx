import { ReactNode, Suspense } from 'react';
import { redirect } from 'next/navigation';
import { LOGIN_PAGE_ROUTE } from '@chat-app/core';
import { Box, CircularProgress } from '@mui/material';

import { ChatAppLayout, ErrorBoundary } from '@/components';
import { getCurrentUserFromSessionCookie } from '@/lib';

export default async function ChatLayout({ children }: { children: ReactNode }) {
    const currentUser = await getCurrentUserFromSessionCookie();
    if (!currentUser) {
        redirect(LOGIN_PAGE_ROUTE);
    }

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
            <ErrorBoundary>
                <ChatAppLayout>{children}</ChatAppLayout>
            </ErrorBoundary>
        </Suspense>
    );
}
