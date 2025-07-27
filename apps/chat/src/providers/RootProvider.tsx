'use client';

import { SWRConfig } from 'swr';
import { AuthInitializer } from '@/components/auth/AuthInitializer';
import { Toaster } from 'react-hot-toast';
import { CustomThemeProvider } from './CustomThemeProvider';

export function RootProvider({ children }: { children: React.ReactNode }) {
    return (
        <SWRConfig
            value={{
                fetcher: (resource, init) => fetch(resource, init).then(res => res.json()),
            }}
        >
            <AuthInitializer />
            <CustomThemeProvider>
                <Toaster position="top-center" reverseOrder={false} />
                <main className="h-screen">{children}</main>
            </CustomThemeProvider>
        </SWRConfig>
    );
}
