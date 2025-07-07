import { ReactNode } from 'react';
import { Toaster } from 'react-hot-toast';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

import { AuthProvider } from '@/providers';

import './globals.css';

const inter = Inter({ subsets: ['latin'] });

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
            <body className={inter.className}>
                <AuthProvider>
                    <Toaster position="top-center" reverseOrder={false} />
                    <main className="h-screen">{children}</main>
                </AuthProvider>
            </body>
        </html>
    );
}
