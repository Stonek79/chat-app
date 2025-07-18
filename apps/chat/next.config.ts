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
        '@chat-app/server-shared',
        '@chat-app/constants-edge', // Edge Runtime compatible constants
        '@chat-app/media-storage',
    ],
    experimental: {
        externalDir: true, // Разрешает импорты из внешних директорий
    },
    webpack: (config, { isServer }) => {
        // Алиас для @/* путей оставляем.
        // Алиасы для workspace-пакетов убираем, так как transpilePackages должен
        // сам разрешать пути к исходникам, а не к собранной папке dist.
        config.resolve.alias = {
            ...config.resolve.alias,
            '@/*': path.join(__dirname, 'src'),
        };

        // externals для workspace-пакетов также не нужны при использовании transpilePackages
        if (isServer) {
            config.externals = config.externals || [];
            config.externals.push({
                sharp: 'commonjs sharp',
            });
        }
        return config;
    },
};

export default nextConfig;
