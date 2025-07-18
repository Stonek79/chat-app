#!/usr/bin/env tsx

/**
 * Build script для создания Edge Runtime совместимых констант
 * Просто реэкспорт всех констант из imports
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

console.log('🔧 Generating Edge constants (reexport all)...\n');

// Путь к выходной папке в корне проекта
const OUTPUT_DIR = join(process.cwd(), '..', '..', 'constants-edge');

// Создаем папку если она не существует
mkdirSync(OUTPUT_DIR, { recursive: true });

// Импортируем все константы из собранного core пакета
import * as constants from '../src/constants';

// Получаем все экспортированные константы
const allConstants = Object.entries(constants).filter(([name, value]) => {
    // Фильтруем примитивные значения
    if (
        typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean' ||
        Array.isArray(value)
    ) {
        return true;
    }

    return false;
});

console.log(`📦 Reexporting ${allConstants.length} constants`);

// Генерируем JS файл
const jsContent = [
    '/**',
    ' * Edge Runtime constants - AUTO-GENERATED',
    ' * Source: @chat-app/core/src/constants',
    ' */',
    '',
    ...allConstants.map(([name, value]) => `export const ${name} = ${JSON.stringify(value)};`),
    '',
].join('\n');

// Генерируем .d.ts файл
const dtsContent = [
    '/**',
    ' * Type definitions for Edge Runtime constants - AUTO-GENERATED',
    ' * Source: @chat-app/core/src/constants',
    ' */',
    '',
    ...allConstants.map(
        ([name, value]) => `export declare const ${name}: ${JSON.stringify(value)};`
    ),
    '',
].join('\n');

// Записываем файлы в packages/constants-edge, НЕ трогая package.json
writeFileSync(join(OUTPUT_DIR, 'index.js'), jsContent);
writeFileSync(join(OUTPUT_DIR, 'index.d.ts'), dtsContent);

console.log('✅ Generated Edge constants');
console.log(`📦 Output: ${OUTPUT_DIR}`);
