import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromSessionCookie, prisma, ApiError, handleApiError, signJwt } from '@/lib';
import { BUCKETS, uploadFile, deleteFileLocally } from '@chat-app/media-storage';
import {
    HOME_PAGE_ROUTE,
    toClientUser,
    UI_MESSAGES,
    AUTH_TOKEN_COOKIE_NAME,
    ERROR_CODES,
} from '@chat-app/core';

export async function POST(req: NextRequest) {
    try {
        const sessionUser = await getCurrentUserFromSessionCookie();
        if (!sessionUser) {
            throw new ApiError(ERROR_CODES.UNAUTHORIZED, 401);
        }

        const formData = await req.formData();
        const file = formData.get('avatar') as File | null;

        if (!file) {
            throw new ApiError(UI_MESSAGES.FILE_NOT_PROVIDED, 400);
        }

        if (!file.type.startsWith('image/')) {
            throw new ApiError(UI_MESSAGES.FILE_NOT_IMAGE, 400);
        }

        const MAX_SIZE_MB = 1;
        if (file.size > MAX_SIZE_MB * 1024 * 1024) {
            throw new ApiError(`${UI_MESSAGES.FILE_SIZE_EXCEEDS} ${MAX_SIZE_MB}MB`, 400);
        }

        const fileBuffer = Buffer.from(await file.arrayBuffer());
        const fileName = `${sessionUser.id}-${crypto.randomUUID()}.webp`;

        const avatarUrl = await uploadFile(BUCKETS.AVATARS, fileName, fileBuffer);

        const updatedUser = await prisma.user.update({
            where: { id: sessionUser.id },
            data: { avatarUrl },
        });

        const clientUser = toClientUser(updatedUser);

        // Перевыпускаем токен с новым avatarUrl
        const newToken = await signJwt({
            userId: clientUser.id,
            username: clientUser.username,
            email: clientUser.email,
            role: clientUser.role,
            avatarUrl: clientUser.avatarUrl,
        });

        const response = NextResponse.json({ user: clientUser }, { status: 200 });

        response.cookies.set(AUTH_TOKEN_COOKIE_NAME, newToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV !== 'development',
            path: HOME_PAGE_ROUTE,
            sameSite: 'lax',
        });

        return response;
    } catch (error) {
        return handleApiError(error);
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const sessionUser = await getCurrentUserFromSessionCookie();
        if (!sessionUser) {
            throw new ApiError(ERROR_CODES.UNAUTHORIZED, 401);
        }

        // Получаем полную информацию о пользователе из БД
        const user = await prisma.user.findUnique({ where: { id: sessionUser.id } });

        if (!user || !user.avatarUrl) {
            return NextResponse.json(
                { message: 'No avatar to delete' },
                {
                    status: 200,
                }
            );
        }

        const fileName = user.avatarUrl.split('/').pop();

        if (fileName) {
            await deleteFileLocally(BUCKETS.AVATARS, fileName);
        }

        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: { avatarUrl: null },
        });

        const clientUser = toClientUser(updatedUser);

        // Перевыпускаем токен с удаленным avatarUrl
        const newToken = await signJwt({
            userId: clientUser.id,
            username: clientUser.username,
            email: clientUser.email,
            role: clientUser.role,
            avatarUrl: null,
        });

        const response = NextResponse.json({ user: clientUser }, { status: 200 });

        response.cookies.set(AUTH_TOKEN_COOKIE_NAME, newToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV !== 'development',
            path: HOME_PAGE_ROUTE,
            sameSite: 'lax',
        });

        return response;
    } catch (error) {
        return handleApiError(error);
    }
}
