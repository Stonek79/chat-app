import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { presignedUrlRequestSchema } from '@chat-app/core';
import { getPresignedUrlForUpload, getPublicFileUrl } from '@chat-app/media-storage';
import { getCurrentUser, handleApiError } from '@/lib';

export async function POST(req: NextRequest) {
    try {
        const currentUser = await getCurrentUser(req);
        if (!currentUser) {
            return NextResponse.json(
                { error: 'Пользователь не аутентифицирован' },
                { status: 401 }
            );
        }

        const body = await req.json();
        const validation = presignedUrlRequestSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: validation.error.format() }, { status: 400 });
        }

        const { fileName, fileType, chatId } = validation.data;

        // Генерируем уникальное имя файла, чтобы избежать конфликтов
        const uniqueFileName = `${randomUUID()}-${fileName}`;
        const fileKey = `chats/${chatId}/${uniqueFileName}`;

        // 1. Получаем ссылку для загрузки
        const uploadUrl = await getPresignedUrlForUpload(fileKey, fileType);

        // 2. Получаем публичную ссылку, которую будем хранить в БД
        const publicUrl = getPublicFileUrl(fileKey);

        return NextResponse.json({
            uploadUrl,
            publicUrl,
        });
    } catch (error) {
        return handleApiError(error);
    }
}
