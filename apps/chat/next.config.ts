import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
    reactStrictMode: true,
    output: 'standalone', // для Docker
    eslint: {
        ignoreDuringBuilds: true,
    },
    transpilePackages: [
        '@chat-app/core',
        '@chat-app/db',
        '@chat-app/socket-shared',
        // '@chat-app/server-shared',
        '@chat-app/constants-edge', // Edge Runtime compatible constants
        '@chat-app/media-storage'
    ],
    experimental: {
        externalDir: true, // Разрешает импорты из внешних директорий
    },
    webpack: (config, { isServer }) => {
        // Добавляем алиасы для разрешения @/* путей и workspace пакетов
        config.resolve.alias = {
            ...config.resolve.alias,
            '@/*': path.join(__dirname, 'src'),
            '@chat-app/core': path.join(__dirname, '../../packages/core/dist'),
            '@chat-app/db': path.join(__dirname, '../../packages/db/dist'),
            '@chat-app/socket-shared': path.join(__dirname, '../../packages/socket-shared/dist'),
            // '@chat-app/server-shared': path.join(__dirname, '../../packages/server-shared/dist'),
            '@chat-app/constants-edge': path.join(__dirname, '../../constants-edge'),
            '@chat-app/media-storage': path.join(__dirname, '../../packages/media-storage/dist'),
        };

        // Исправляем проблемы с ESM модулями в Node.js
        if (isServer) {
            config.externals = config.externals || [];
            config.externals.push({
                '@chat-app/core': 'commonjs @chat-app/core',
                '@chat-app/db': 'commonjs @chat-app/db',
                '@chat-app/socket-shared': 'commonjs @chat-app/socket-shared',
                '@chat-app/media-storage': 'commonjs @chat-app/media-storage',
                '@chat-app/constants-edge': 'commonjs @chat-app/constants-edge',
                // '@chat-app/server-shared': 'commonjs @chat-app/server-shared',
                sharp: 'commonjs sharp',
            });
        }
        return config;
    },
};

export default nextConfig;
