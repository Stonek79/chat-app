'use client';

import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { CustomThemeProvider } from '@/providers';
import CssBaseline from '@mui/material/CssBaseline';

export function ThemeRegistry({ children }: { children: React.ReactNode }) {
    return (
        <AppRouterCacheProvider>
            <CustomThemeProvider>
                {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
                <CssBaseline />
                {children}
            </CustomThemeProvider>
        </AppRouterCacheProvider>
    );
}
