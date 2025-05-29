import { NextRequest, NextResponse } from 'next/server';
import { handleApiError, ApiError, prisma } from '@/lib';
import jwt from 'jsonwebtoken';
import { AUTH_TOKEN_COOKIE_NAME, HOME_PAGE_ROUTE } from '@/constants';
import { User } from '@prisma/client';

interface ConfirmParams {
    params: {
        token: string;
    };
}

/**
 * @swagger
 * /api/auth/confirm/{token}:
 *   get:
 *     summary: Подтверждение email пользователя
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         description: Токен подтверждения, полученный по email.
 *         schema:
 *           type: string
 *     responses:
 *       302:
 *         description: Редирект на страницу входа с сообщением (успех или если email уже подтвержден).
 *         headers:
 *           Location:
 *             description: URL для редиректа (например, /login?message=Email+успешно+подтвержден).
 *             schema:
 *               type: string
 *       400:
 *         description: Токен не предоставлен, неверный или истекший.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Внутренняя ошибка сервера.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export async function GET(req: NextRequest, { params }: ConfirmParams) {
    const { token: verificationToken } = params;

    try {
        if (!verificationToken) {
            throw new ApiError('Токен не предоставлен', 400);
        }

        const user: User | null = await prisma.user.findFirst({
            where: {
                verificationToken: verificationToken,
                verificationTokenExpires: { gt: new Date() },
            },
        });

        if (!user) {
            throw new ApiError('Неверный или истекший токен подтверждения', 400);
        }

        if (user.isVerified) {
            const homeUrl = new URL(HOME_PAGE_ROUTE, req.nextUrl.origin);
            const sessionToken = req.cookies.get(AUTH_TOKEN_COOKIE_NAME)?.value;
            if (sessionToken) {
                try {
                    jwt.verify(sessionToken, process.env.JWT_SECRET as string);
                    return NextResponse.redirect(homeUrl);
                } catch (e) {
                    // Сессия невалидна, нужно создать новую
                }
            }
            const tokenPayload = {
                userId: user.id,
                email: user.email,
                username: user.username,
                role: user.role,
            };
            const jwtSecret: jwt.Secret = process.env.JWT_SECRET as string;
            if (!jwtSecret) {
                console.error(
                    'JWT_SECRET не определен в .env для /api/auth/confirm (блок isVerified)'
                );
                throw new ApiError('Ошибка конфигурации сервера (JWT) - секрет не найден', 500);
            }
            const expiresInString: string = process.env.JWT_EXPIRES_IN || '14d';
            const signOptions: jwt.SignOptions = {
                expiresIn: expiresInString as jwt.SignOptions['expiresIn'],
            };
            const newJwtToken = jwt.sign(tokenPayload, jwtSecret, signOptions);
            const response = NextResponse.redirect(homeUrl);
            response.cookies.set(AUTH_TOKEN_COOKIE_NAME, newJwtToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: HOME_PAGE_ROUTE,
                maxAge: parseInt(process.env.JWT_MAX_AGE_SECONDS || String(14 * 24 * 60 * 60)),
            });
            return response;
        }

        const updatedUser: User = await prisma.user.update({
            where: { id: user.id },
            data: {
                isVerified: true,
                verificationToken: null,
                verificationTokenExpires: null,
            },
        });

        const tokenPayload = {
            userId: updatedUser.id,
            email: updatedUser.email,
            username: updatedUser.username,
            role: updatedUser.role,
        };

        const jwtSecret: jwt.Secret = process.env.JWT_SECRET as string;
        if (!jwtSecret) {
            console.error('JWT_SECRET не определен в .env для /api/auth/confirm');
            throw new ApiError('Ошибка конфигурации сервера (JWT) - секрет не найден', 500);
        }

        const expiresInString: string = process.env.JWT_EXPIRES_IN || '14d';
        const signOptions: jwt.SignOptions = {
            expiresIn: expiresInString as jwt.SignOptions['expiresIn'],
        };

        const jwtToken = jwt.sign(tokenPayload, jwtSecret, signOptions);

        const redirectUrl = new URL(HOME_PAGE_ROUTE, req.nextUrl.origin);
        const response = NextResponse.redirect(redirectUrl);

        response.cookies.set(AUTH_TOKEN_COOKIE_NAME, jwtToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: HOME_PAGE_ROUTE,
            maxAge: parseInt(process.env.JWT_MAX_AGE_SECONDS || String(14 * 24 * 60 * 60)),
        });

        return response;
    } catch (error) {
        if (error instanceof ApiError) {
            return handleApiError(error, {
                status: error.status,
                message: error.message,
                errors: error.errors,
            });
        }
        return handleApiError(error, {
            message: 'Внутренняя ошибка сервера при подтверждении email',
        });
    }
}
