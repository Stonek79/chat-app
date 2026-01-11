import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    reactStrictMode: true,
    output: 'standalone', // для Docker
    transpilePackages: [
        '@chat-app/core',
        '@chat-app/db',
        '@chat-app/socket-shared',
        '@chat-app/server-shared',
        '@chat-app/media-storage',
    ],
    experimental: {
        externalDir: true, // Разрешает импорты из внешних директорий
    },
};

export default nextConfig;
