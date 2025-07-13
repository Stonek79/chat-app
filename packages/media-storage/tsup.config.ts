import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    sourcemap: true,
    treeshake: true,
    clean: true,
    splitting: false,
    outExtension({ format }) {
        return {
            js: format === 'cjs' ? '.cjs' : '.mjs',
        };
    },
});
