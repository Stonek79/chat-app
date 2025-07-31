import fs from 'fs/promises';
import path from 'path';

export const BUCKETS = {
    AVATARS: 'avatars',
    MEDIA: 'media',
} as const;

export type BucketName = (typeof BUCKETS)[keyof typeof BUCKETS];

// Базовый путь для хранения всех загружаемых файлов.
// В Docker это будет путь к смонтированному volume.
const UPLOADS_BASE_PATH = process.env.UPLOADS_PATH;

if (!UPLOADS_BASE_PATH) {
    throw new Error(
        'UPLOADS_PATH environment variable is not set. This is required for file storage.'
    );
}

/**
 * Гарантирует, что директория для бакета существует.
 * @param bucketName - Имя бакета (поддиректории).
 */
async function ensureBucketDirectoryExists(bucketName: BucketName): Promise<void> {
    const bucketPath = path.join(UPLOADS_BASE_PATH!, bucketName);
    try {
        await fs.mkdir(bucketPath, { recursive: true });
    } catch (error) {
        console.error(`Error creating directory for bucket ${bucketName}:`, error);
        throw new Error(`Could not create storage directory for ${bucketName}.`);
    }
}

/**
 * Сохраняет буфер файла в локальную файловую систему.
 * @param bucketName - Имя бакета (поддиректория для сохранения).
 * @param fileName - Имя файла.
 * @param fileBuffer - Буфер с данными файла.
 */
export async function saveFileLocally(
    bucketName: BucketName,
    fileName: string,
    fileBuffer: Buffer
): Promise<void> {
    await ensureBucketDirectoryExists(bucketName);
    const filePath = path.join(UPLOADS_BASE_PATH!, bucketName, fileName);
    try {
        await fs.writeFile(filePath, fileBuffer);
    } catch (error) {
        console.error(`Error writing file ${fileName} to bucket ${bucketName}:`, error);
        throw new Error('Could not save file to storage.');
    }
}

/**
 * Удаляет файл из локальной файловой системы.
 * @param bucketName - Имя бакета (поддиректория).
 * @param fileName - Имя файла для удаления.
 */
export async function deleteFileLocally(bucketName: BucketName, fileName: string): Promise<void> {
    const filePath = path.join(UPLOADS_BASE_PATH!, bucketName, fileName);
    try {
        await fs.unlink(filePath);
        console.log(`Successfully deleted file: ${filePath}`);
    } catch (error: any) {
        // Игнорируем ошибку, если файл не найден (возможно, уже удален)
        if (error.code !== 'ENOENT') {
            console.error(`Error deleting file ${fileName} from bucket ${bucketName}:`, error);
            throw new Error('Could not delete file from storage.');
        }
    }
}

/**
 * Удаляет файл по его относительному URL.
 * Разбирает URL, чтобы определить бакет и имя файла.
 * @param fileUrl - Относительный URL файла (например, /uploads/media/image.png).
 */
export async function deleteFile(fileUrl: string): Promise<void> {
    try {
        let pathname: string;
        try {
            // Пытаемся обработать как полный URL
            const urlObject = new URL(fileUrl);
            pathname = urlObject.pathname;
        } catch (e) {
            // Если это не полный URL, считаем, что это уже путь
            pathname = fileUrl;
        }
        // Нормализуем URL и разбиваем на части
        const parts = pathname.split('/').filter(p => p); // parts = ['uploads', 'media', 'image.png']

        // Проверяем, соответствует ли URL ожидаемой структуре
        if (parts.length < 3 || parts[0] !== path.basename(UPLOADS_BASE_PATH!)) {
            console.warn(
                `Invalid or malformed file URL provided for deletion: ${fileUrl}. Skipping.`
            );
            return;
        }

        const bucket = parts[1] as BucketName;
        const fileName = parts.slice(2).join('/'); // На случай, если в имени файла есть поддиректории

        // Проверяем, является ли бакет валидным
        if (!Object.values(BUCKETS).includes(bucket)) {
            console.warn(`Unknown bucket '${bucket}' in URL: ${fileUrl}. Skipping deletion.`);
            return;
        }

        await deleteFileLocally(bucket, fileName);
    } catch (error) {
        console.error(`Failed to process deletion for URL "${fileUrl}":`, error);
        // Не пробрасываем ошибку дальше, чтобы не прерывать основную транзакцию,
        // но логируем ее для дальнейшего анализа.
    }
}

/**
 * Инициализирует все необходимые директории для бакетов.
 */
export async function initializeStorage(): Promise<void> {
    console.log('Initializing local file storage directories...');
    for (const bucket of Object.values(BUCKETS)) {
        await ensureBucketDirectoryExists(bucket);
    }
    console.log('Local file storage initialized.');
}
