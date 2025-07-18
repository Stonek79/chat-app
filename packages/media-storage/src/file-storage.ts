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
 * Инициализирует все необходимые директории для бакетов.
 */
export async function initializeStorage(): Promise<void> {
    console.log('Initializing local file storage directories...');
    for (const bucket of Object.values(BUCKETS)) {
        await ensureBucketDirectoryExists(bucket);
    }
    console.log('Local file storage initialized.');
}
 