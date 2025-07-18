import sharp from 'sharp';
import path from 'path';
import { getServerConfig } from '@chat-app/server-shared';
import { saveFileLocally, BUCKETS, BucketName } from './file-storage';
import { IMAGE_PROCESSING_PROFILES, ImageProcessingProfile } from '@chat-app/core';

/**
 * Обрабатывает изображение с помощью sharp: изменяет размер, обрезает и конвертирует в WebP.
 * @param fileBuffer - Буфер исходного изображения.
 * @param profileName - Название профиля обработки ('AVATAR' или 'MESSAGE_IMAGE').
 * @returns Буфер обработанного изображения в формате WebP.
 */
async function processImage(
    fileBuffer: Buffer,
    profileName: ImageProcessingProfile
): Promise<Buffer> {
    const profile = IMAGE_PROCESSING_PROFILES[profileName];
    try {
        const pipeline = sharp(fileBuffer)
            .resize({
                width: profile.maxWidth,
                height: profile.maxHeight,
                fit: profile.fit,
                withoutEnlargement: true, // Не увеличивать, если изображение меньше
            })
            .webp({ quality: profile.quality });

        return await pipeline.toBuffer();
    } catch (error) {
        console.error(`Image processing failed for profile ${profileName}:`, error);
        throw new Error('Could not process the image.');
    }
}

/**
 * Загружает файл, обрабатывает его (если это изображение) и сохраняет локально.
 * @param bucketName - Имя бакета для сохранения.
 * @param fileName - Исходное имя файла.
 * @param fileBuffer - Буфер с данными файла.
 * @returns Публичный URL для доступа к файлу.
 */
export async function uploadFile(
    bucketName: BucketName,
    fileName: string,
    fileBuffer: Buffer
): Promise<string> {
    let processedBuffer = fileBuffer;
    let finalFileName = fileName;

    const isImage = /\.(jpg|jpeg|png|gif|bmp|tiff|webp)$/i.test(fileName);

    if (isImage) {
        const profileName: ImageProcessingProfile =
            bucketName === BUCKETS.AVATARS ? 'AVATAR' : 'MESSAGE_IMAGE';

        processedBuffer = await processImage(fileBuffer, profileName);

        // Принудительно меняем расширение на .webp
        finalFileName = `${path.parse(fileName).name}.webp`;
    }

    // Сохраняем файл в локальное хранилище
    await saveFileLocally(bucketName, finalFileName, processedBuffer);

    // Формируем публичный URL
    const { MEDIA_PUBLIC_URL } = getServerConfig();
    return `${MEDIA_PUBLIC_URL}/${bucketName}/${finalFileName}`;
}
