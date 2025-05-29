import type { NextConfig } from 'next';
import withPWAInit from 'next-pwa';

const pwaConfig = {
    dest: 'public',
    disable: process.env.NODE_ENV === 'development',
    register: true,
    skipWaiting: true,
    // Дополнительные опции PWA, если нужны:
    // cacheOnFrontEndNav: true,
    // fallbacks: {
    //   document: '/_offline.html', // Создайте этот файл в /public
    // },
    // workboxOptions: {
    //   runtimeCaching: [], // Ваши стратегии кэширования
    // },
};

const nextConfig: NextConfig = {
    reactStrictMode: true,
    // Другие ваши настройки Next.js
    // например, experimental: { turbo: true }, для Turbopack
    // output: 'standalone', // для Docker
};

// Оборачиваем основную конфигурацию Next.js в конфигурацию PWA
// Тип для withPWAInit может быть не идеальным, но это стандартный способ использования
// Приводим nextConfig к any, чтобы обойти конфликт типов между NextConfig из 'next' и ожидаемым @types/next-pwa
const configWithPWA = withPWAInit(pwaConfig)(nextConfig as any);

export default configWithPWA;
