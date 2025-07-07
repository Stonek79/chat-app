import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    clean: true,
    treeshake: true,
    minify: false,
    external: ['zod'], // НЕ инлайним zod, позволяем приложению использовать свою версию
    // Только @chat-app/db инлайним (он легкий, только типы)
    noExternal: ['@chat-app/db'],
    // Указываем правильные расширения для избежания конфликта с "type": "module"
    outExtension({ format }) {
        return {
            js: format === 'cjs' ? '.cjs' : '.mjs',
        };
    },
});
