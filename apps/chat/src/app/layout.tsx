import { ReactNode } from 'react';
import type { Metadata } from 'next';
import './globals.css';
import '@fontsource/inter';
import { RootProvider } from '@/providers/RootProvider';

export const metadata: Metadata = {
    title: 'Chat App',
    description: 'Современное PWA-чат-приложение',
};

interface RootLayoutProps {
    children: ReactNode;
}

/**
 * Корневой макет приложения.
 * @param {RootLayoutProps} props - Свойства компонента.
 * @returns {JSX.Element} Корневой макет.
 */
export default function RootLayout({ children }: Readonly<RootLayoutProps>) {
    return (
        <html lang="ru">
            <body>
                <RootProvider>{children}</RootProvider>
            </body>
        </html>
    );
}
