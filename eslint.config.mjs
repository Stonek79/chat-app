import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import globals from 'globals';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
    baseDirectory: __dirname,
});

const eslintConfig = [
    {
        ignores: ['next', 'node_modules', 'dist', 'public', 'socket-server/node_modules'],
    },
    ...compat.extends('next/core-web-vitals', 'next/typescript'),
    {
        plugins: { 'simple-import-sort': simpleImportSort },
        rules: {
            'simple-import-sort/imports': [
                'error',
                {
                    groups: [
                        // Сторонние пакеты. `react` и `next` идут первыми.
                        ['^react', '^next', '^@?\\w'],
                        // Внутренние абсолютные импорты.
                        ['^@/.*$'],
                        // Импорты с побочными эффектами.
                        ['^\\u0000'],
                        // Родительские импорты. `..` идут последними.
                        ['^\\.\\.(?!/?$)', '^\\.\\./?$'],
                        // Другие относительные импорты. Импорты из той же папки `.` идут последними.
                        ['^\\./(?=.*/)(?!/?$)', '^\\.(?!/?$)', '^\\./?$'],
                        // Импорты стилей.
                        ['^.+\\.s?css$'],
                    ],
                },
            ],
            'simple-import-sort/exports': 'error',
        },
    },
    {
        rules: {
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
        },
    },
    {
        files: ['src/**/*.{ts,tsx}'],
        rules: {
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
    ...compat.extends('plugin:@typescript-eslint/recommended').map(config => ({
        ...config,
        files: ['socket-server/src/**/*.ts'],
    })),
    {
        files: ['socket-server/src/**/*.ts'],
        languageOptions: {
            globals: {
                ...globals.node,
            },
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
            '@typescript-eslint/no-unused-vars': 'warn',
            '@typescript-eslint/no-explicit-any': 'warn',
        },
    },
];

export default eslintConfig;
