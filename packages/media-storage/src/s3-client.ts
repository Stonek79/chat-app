import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Конфигурация клиента S3. Берем данные из переменных окружения.
const s3Client = new S3Client({
    endpoint: `http://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}`,
    region: 'us-east-1', // Для MinIO это стандартное значение
    credentials: {
        accessKeyId: process.env.MINIO_ROOT_USER!,
        secretAccessKey: process.env.MINIO_ROOT_PASSWORD!,
    },
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true', // Очень важно для MinIO
});

const BUCKET_NAME = process.env.MINIO_BUCKET!;
const PRESIGNED_URL_EXPIRES_IN = 300; // Ссылка будет действительна 5 минут

/**
 * Генерирует пред-подписанную ссылку для ЗАГРУЗКИ файла в S3-хранилище.
 * @param key - Уникальный ключ объекта (путь/имя файла) в бакете.
 * @param contentType - MIME-тип файла (e.g., 'image/jpeg').
 * @returns {Promise<string>} - URL для загрузки.
 */
export const getPresignedUrlForUpload = async (
    key: string,
    contentType: string
): Promise<string> => {
    const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        ContentType: contentType,
    });

    return getSignedUrl(s3Client, command, { expiresIn: PRESIGNED_URL_EXPIRES_IN });
};

/**
 * Получает публичную, постоянную ссылку для ЧТЕНИЯ файла.
 * Примечание: Это работает только если бакет публично доступен для чтения.
 * Для приватных бакетов нужно будет генерировать presigned URL и для чтения.
 * @param key - Уникальный ключ объекта (путь/имя файла) в бакете.
 * @returns {string} - URL для доступа к файлу.
 */
export const getPublicFileUrl = (key: string): string => {
    // В случае MinIO и forcePathStyle=true, URL формируется просто.
    return `http://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}/${BUCKET_NAME}/${key}`;
};
