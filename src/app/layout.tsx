import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ReactNode } from 'react';
import { AuthProvider } from '@/providers';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'Chat App',
    description: 'Современное PWA-чат-приложение',
    manifest: '/manifest.json',
    icons: {
        apple: '/icons/icon-192x192.png',
    },
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
                    <main>{children}</main>
                </AuthProvider>
            </body>
        </html>
    );
}
