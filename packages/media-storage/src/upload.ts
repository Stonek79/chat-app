import sharp from 'sharp';
import { minioClient, BUCKETS } from './client';
import { Readable } from 'stream';
import { getServerConfig } from '@chat-app/server-shared';

const RESIZE_OPTIONS: Record<typeof BUCKETS.AVATARS, sharp.ResizeOptions> = {
    [BUCKETS.AVATARS]: {
        width: 200,
        height: 200,
        fit: 'cover',
    },
};

type BucketName = (typeof BUCKETS)[keyof typeof BUCKETS];

/**
 * Uploads a file to a specified MinIO bucket.
 * If the bucket is for avatars, it resizes and converts the image to WebP.
 *
 * @param bucketName - The name of the bucket to upload to.
 * @param fileName - The name of the file to create in the bucket (should end with .webp).
 * @param fileBuffer - The buffer containing the original file data.
 * @returns The public URL of the uploaded file.
 */
export async function uploadFile(
    bucketName: BucketName,
    fileName: string,
    fileBuffer: Buffer
): Promise<string> {
    let processedBuffer = fileBuffer;
    let finalContentType = 'application/octet-stream'; // Default content type

    // Resize and convert image if it's an avatar
    if (bucketName === BUCKETS.AVATARS) {
        processedBuffer = await sharp(fileBuffer)
            .resize(RESIZE_OPTIONS[bucketName])
            .webp({ quality: 80 })
            .toBuffer();
        finalContentType = 'image/webp';
    }

    const stream = Readable.from(processedBuffer);
    const metaData = {
        'Content-Type': finalContentType,
    };

    await minioClient.client.putObject(
        bucketName,
        fileName,
        stream,
        processedBuffer.length,
        metaData
    );

    const env = getServerConfig();
    const publicUrl = `${env.MEDIA_PUBLIC_URL}/${bucketName}/${fileName}`;

    return publicUrl;
}
