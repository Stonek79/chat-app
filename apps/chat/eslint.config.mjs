import { FlatCompat } from '@eslint/eslintrc';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log(__dirname);

const compat = new FlatCompat({
    baseDirectory: __dirname,
});

const eslintConfig = [
    {
        ignores: ['.next', 'node_modules', 'dist', 'public', 'prisma/seed.ts', 'memory-bank/'],
    },
    // Блок 1: Базовая конфигурация для Next.js приложения
    ...compat.extends('next/core-web-vitals', 'next/typescript').map(config => ({
        ...config,
        files: ['src/**/*.{ts,tsx}'],
    })),
    // Блок 2: Наши кастомные правила, применяемые поверх базовых
    {
        files: ['src/**/*.{ts,tsx}'],
        plugins: {
            'simple-import-sort': simpleImportSort,
        },
        rules: {
            // Запрет any типов для безопасности
            '@typescript-eslint/no-explicit-any': 'error',

            'simple-import-sort/imports': [
                'error',
                {
                    groups: [
                        ['^react', '^next', '^@?\\w'],
                        ['^@/.*$'],
                        ['^\\u0000'],
                        ['^\\.\\.(?!/?$)', '^\\.\\./?$'],
                        ['^\\./(?=.*/)(?!/?$)', '^\\.(?!/?$)', '^\\./?$'],
                        ['^.+\\.s?css$'],
                    ],
                },
            ],
            'simple-import-sort/exports': 'error',
            'no-restricted-imports': [
                'error',
                {
                    patterns: [
                        {
                            group: ['@/components/*/*'],
                            message:
                                'Please use barrel file imports for components: `@/components`',
                        },
                        {
                            group: ['@/constants/*'],
                            message: 'Please use barrel file imports for constants: `@/constants`',
                        },
                        {
                            group: ['@/contexts/*'],
                            message: 'Please use barrel file imports for contexts: `@/contexts`',
                        },
                        {
                            group: ['@/hooks/*'],
                            message: 'Please use barrel file imports for hooks: `@/hooks`',
                        },
                        {
                            group: ['@/lib/*'],
                            message: 'Please use barrel file imports for lib: `@/lib`',
                        },
                        {
                            group: ['@/providers/*'],
                            message: 'Please use barrel file imports for providers: `@/providers`',
                        },
                        {
                            group: ['@/schemas/*'],
                            message: 'Please use barrel file imports for schemas: `@/schemas`',
                        },
                        {
                            group: ['@/store/*'],
                            message: 'Please use barrel file imports for store: `@/store`',
                        },
                        {
                            group: ['@/types/*/*'],
                            message: 'Please use barrel file imports for types: `@/types`',
                        },
                        {
                            group: ['@/utils/*'],
                            message: 'Please use barrel file imports for utils: `@/utils`',
                        },
                    ],
                },
            ],
            'no-restricted-syntax': [
                'error',
                {
                    selector: 'TSAsExpression',
                    message:
                        'Type assertions using `as` are forbidden. Use type guards, Zod parsing, or other type-safe alternatives instead.',
                },
            ],
        },
    },
    // Конфигурация для Socket.IO сервера
    ...compat.extends('plugin:@typescript-eslint/recommended').map(config => ({
        ...config,
        files: ['socket-server/**/*.ts'],
    })),
    {
        files: ['socket-server/**/*.ts'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
        },
        plugins: { 'simple-import-sort': simpleImportSort },
        rules: {
            'simple-import-sort/imports': [
                'error',
                {
                    groups: [
                        ['^@?\\w'],
                        ['^#/.+$'],
                        ['^\\.\\.(?!/?$)', '^\\.\\./?$'],
                        ['^\\./(?=.*/)(?!/?$)', '^\\.(?!/?$)', '^\\./?$'],
                    ],
                },
            ],
            'simple-import-sort/exports': 'error',
            '@typescript-eslint/no-unused-vars': 'error',
            '@typescript-eslint/no-explicit-any': 'error',
            'no-restricted-syntax': [
                'error',
                {
                    selector: 'TSAsExpression',
                    message:
                        'Type assertions using `as` are forbidden. Use type guards, Zod parsing, or other type-safe alternatives instead.',
                },
            ],
        },
    },
    // Блок 3: Правила для shared пакетов
    {
        files: ['../../packages/shared/src/**/*.ts'],
        plugins: {
            '@typescript-eslint': compat.extends('plugin:@typescript-eslint/recommended')[0]
                .plugins?.['@typescript-eslint'],
        },
        rules: {
            '@typescript-eslint/no-explicit-any': 'error',
            '@typescript-eslint/no-unused-vars': 'error',
        },
    },
];

export default eslintConfig;
