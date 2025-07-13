import { NextRequest } from 'next/server';
import { getCurrentUserFromSessionCookie, prisma, ApiError, handleApiError } from '@/lib';
import { BUCKETS, uploadFile } from '@chat-app/media-storage';
import { randomUUID } from 'crypto';

export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUserFromSessionCookie();
        if (!user) {
            throw new ApiError('Unauthorized', 401);
        }

        const formData = await req.formData();
        const file = formData.get('avatar') as File | null;

        if (!file) {
            throw new ApiError('No file provided', 400);
        }

        if (!file.type.startsWith('image/')) {
            throw new ApiError('File is not an image', 400);
        }

        const MAX_SIZE_MB = 5;
        if (file.size > MAX_SIZE_MB * 1024 * 1024) {
            throw new ApiError(`File size exceeds ${MAX_SIZE_MB}MB`, 400);
        }

        const fileBuffer = Buffer.from(await file.arrayBuffer());
        const fileName = `${user.id}-${randomUUID()}.webp`; // Always save as webp

        const avatarUrl = await uploadFile(BUCKETS.AVATARS, fileName, fileBuffer);

        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: { avatarUrl },
        });

        return new Response(JSON.stringify({ avatarUrl: updatedUser.avatarUrl }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        return handleApiError(error);
    }
}
