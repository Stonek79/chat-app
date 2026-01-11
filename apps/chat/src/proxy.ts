/**
 * @file Middleware для обработки запросов, аутентификации и авторизации.
 *
 * Этот middleware выполняет следующие задачи:
 * 1. Пропускает служебные маршруты Next.js и статические файлы.
 * 2. Пропускает определенные API маршруты, которые имеют собственную логику обработки (например, эндпоинты аутентификации).
 * 3. Проверяет наличие JWT токена в cookie для аутентификации пользователя.
 * 4. Управляет доступом к маршрутам на основе статуса аутентификации и роли пользователя:
 *    - Аутентифицированные пользователи перенаправляются с гостевых маршрутов (например, /login) на домашнюю страницу.
 *    - Доступ к админским маршрутам (начинающимся с ADMIN_ROUTES_PREFIX) разрешен только пользователям с ролью 'ADMIN'.
 *    - Неаутентифицированные пользователи, пытающиеся получить доступ к защищенным маршрутам, перенаправляются на страницу входа с параметром returnTo.
 *    - Публичные маршруты доступны всем.
 * 5. Использует 'jose' для верификации JWT в Edge Runtime.
 */
import { type NextRequest, NextResponse } from 'next/server';
import {
    ADMIN_ROUTES_PREFIX,
    AUTH_TOKEN_COOKIE_NAME,
    CHAT_PAGE_ROUTE,
    GUEST_ONLY_ROUTES,
    IGNORED_API_PREFIXES,
    LOGIN_PAGE_ROUTE,
    PUBLIC_ROUTES,
} from '@chat-app/core';

import { type JWTPayload, jwtVerify } from 'jose';

/**
 * Расширенный интерфейс для JWTPayload, включающий специфичные для приложения поля.
 */
interface UserJWTPayload extends JWTPayload {
    /** Идентификатор пользователя. */
    userId: string;
    /** Email пользователя. */
    email: string;
    /** Имя пользователя (username). */
    username: string;
    /** Роль пользователя (например, 'USER' или 'ADMIN'). */
    role: string; // Роль из токена USER | ADMIN
    /** Аватарка пользователя */
    userAvatar: string;
}

/**
 * Верифицирует и декодирует JWT токен.
 *
 * @param token - Строка JWT токена для верификации.
 * @returns Промис, который разрешается объектом UserJWTPayload в случае успеха, или null в случае ошибки или отсутствия секрета.
 */
async function verifyAndDecodeToken(token: string): Promise<UserJWTPayload | null> {
    const JWT_SECRET_KEY = process.env.JWT_SECRET;

    if (!JWT_SECRET_KEY) {
        console.error('JWT_SECRET is not set in environment variables for middleware.');
        return null;
    }
    try {
        const secret = new TextEncoder().encode(JWT_SECRET_KEY);

        const { payload } = await jwtVerify(token, secret);
        return payload as UserJWTPayload;
    } catch (error: unknown) {
        console.warn(
            'JWT verification failed in middleware:',
            error instanceof Error ? error.message : 'Unknown error'
        );
        return null;
    }
}

/**
 * Основная функция middleware для Next.js.
 * Обрабатывает входящие запросы для аутентификации и авторизации.
 *
 * @param request - Объект NextRequest, представляющий входящий запрос.
 * @returns Промис, который разрешается объектом NextResponse, указывающим, как обработать запрос (например, продолжить, перенаправить).
 */
export async function proxy(request: NextRequest) {
    const { pathname, search, origin } = request.nextUrl;
    const token = request.cookies.get(AUTH_TOKEN_COOKIE_NAME)?.value;

    // 1. Пропускаем служебные маршруты Next.js и статические файлы
    if (pathname.startsWith('/_next') || pathname.startsWith('/static') || pathname.includes('.')) {
        return NextResponse.next();
    }

    // 2. Пропускаем определенные API маршруты (логин, регистрация, подтверждение, me)
    if (IGNORED_API_PREFIXES.some(prefix => pathname.startsWith(prefix))) {
        return NextResponse.next();
    }

    const decodedToken = token ? await verifyAndDecodeToken(token) : null;
    const isAuthenticated = !!decodedToken;
    const userRole = decodedToken?.role;

    // Логика для аутентифицированных пользователей
    if (isAuthenticated) {
        // Если аутентифицированный пользователь пытается зайти на гостевой маршрут (login/register)
        // или на корневую страницу (которая теперь WelcomePageContent)
        if ([...GUEST_ONLY_ROUTES, '/'].includes(pathname)) {
            return NextResponse.redirect(new URL(CHAT_PAGE_ROUTE, origin));
        }

        // 3.2. Проверка доступа к админским маршрутам
        if (pathname.startsWith(ADMIN_ROUTES_PREFIX)) {
            if (userRole !== 'ADMIN') {
                // Если не админ, редирект на главную (или страницу "доступ запрещен")
                console.warn(
                    `User ${decodedToken?.username} with role ${userRole} tried to access ${pathname}`
                );
                return NextResponse.redirect(new URL(CHAT_PAGE_ROUTE, origin)); // Или на специальную страницу ошибки доступа
            }
            // Админ имеет доступ, пропускаем
            return NextResponse.next();
        }

        // 3.3. Для всех остальных маршрутов аутентифицированный пользователь имеет доступ
        return NextResponse.next();
    }

    // Логика для НЕаутентифицированных пользователей
    // Если неаутентифицированный пользователь пытается зайти на защищенный маршрут (включая /chat)
    const isProtectedRoute =
        ![...PUBLIC_ROUTES, ...GUEST_ONLY_ROUTES, '/'].includes(pathname) &&
        !IGNORED_API_PREFIXES.some(prefix => pathname.startsWith(prefix)) &&
        !pathname.startsWith('/_next') &&
        !pathname.startsWith('/static') &&
        !pathname.includes('.');

    if (isProtectedRoute) {
        let loginUrl = LOGIN_PAGE_ROUTE;
        // Добавляем returnTo, чтобы после логина пользователь вернулся на запрошенную страницу
        loginUrl += `?returnTo=${encodeURIComponent(pathname + search)}`;
        return NextResponse.redirect(new URL(loginUrl, origin));
    }

    return NextResponse.next();
}

/**
 * Конфигурация middleware.
 * Указывает, к каким маршрутам применять данный middleware.
 *
 * @see https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
 */
export const config = {
    matcher: [
        // Применяем ко всем путям, кроме тех, что явно исключены или имеют расширения (статичные файлы)
        '/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|icons/.*|.*\..*).*)',
        // Исключаем API маршруты из глобального матчера, т.к. они обрабатываются внутри middleware
        // или имеют свою логику. Это позволяет избежать двойной проверки.
        // Однако, если API пути также должны быть затронуты middleware для какой-то общей логики (кроме auth),
        // их нужно включить в матчер и обрабатывать внутри.
        // Пока что API аутентификации исключены выше в коде.
    ],
};
