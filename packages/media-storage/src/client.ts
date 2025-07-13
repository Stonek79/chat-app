import { Client } from 'minio';
import { getServerConfig } from '@chat-app/server-shared';

// Ленивая инициализация MinIO клиента
let minioClientInstance: Client | null = null;

function createMinioClient(): Client {
    if (minioClientInstance) {
        return minioClientInstance;
    }

    const env = getServerConfig();

    if (!env.MINIO_ENDPOINT || !env.MINIO_ACCESS_KEY || !env.MINIO_SECRET_KEY) {
        throw new Error('MinIO environment variables are not set');
    }

    minioClientInstance = new Client({
        endPoint: env.MINIO_ENDPOINT, // Без порта, только hostname
        port: env.MINIO_PORT,
        useSSL: env.MINIO_USE_SSL,
        accessKey: env.MINIO_ACCESS_KEY,
        secretKey: env.MINIO_SECRET_KEY,
    });

    return minioClientInstance;
}

export const minioClient = {
    get client() {
        return createMinioClient();
    },
};

export const BUCKETS = {
    AVATARS: 'avatars',
    MEDIA: 'media',
} as const;

/**
 * Initializes MinIO buckets if they don't exist.
 */
export async function initializeMinio() {
    try {
        const client = createMinioClient();
        const bucketNames = Object.values(BUCKETS);
        for (const bucketName of bucketNames) {
            const bucketExists = await client.bucketExists(bucketName);
            if (!bucketExists) {
                await client.makeBucket(bucketName);
                console.log(`Bucket ${bucketName} created.`);

                // Set public access policy for the buckets
                const policy = JSON.stringify({
                    Version: '2012-10-17',
                    Statement: [
                        {
                            Effect: 'Allow',
                            Principal: {
                                AWS: ['*'],
                            },
                            Action: ['s3:GetObject'],
                            Resource: [`arn:aws:s3:::${bucketName}/*`],
                        },
                    ],
                });
                await client.setBucketPolicy(bucketName, policy);
                console.log(`Bucket ${bucketName} policy set to public read.`);
            }
        }
    } catch (error) {
        console.error('Error initializing MinIO:', error);
        // We don't rethrow the error to not block the server start
    }
}
