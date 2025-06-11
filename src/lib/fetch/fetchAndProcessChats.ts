'use server'; // Указываем, что этот модуль выполняется на сервере

import { cookies } from 'next/headers';

import { API_CHATS_ROUTE, PUBLIC_APP_API_URL } from '@/constants';
import { AUTH_TOKEN_COOKIE_NAME } from '@/constants';
import { ClientChat } from '@/types';

export async function fetchChatsForLayout(): Promise<ClientChat[]> {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || PUBLIC_APP_API_URL;
    const absoluteApiChatsRoute = `${appUrl}${API_CHATS_ROUTE}`;

    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get(AUTH_TOKEN_COOKIE_NAME);

    const fetchOptions: RequestInit = {
        cache: 'no-store',
        headers: {},
    };

    if (tokenCookie) {
        (fetchOptions.headers as Record<string, string>)['Cookie'] =
            `${tokenCookie.name}=${tokenCookie.value}`;
    } else {
        console.warn(
            `fetchChatsForLayout: Cookie "${AUTH_TOKEN_COOKIE_NAME}" not found. API call to /api/chats might fail authentication.`
        );
        // В этом случае, возможно, стоит сразу вернуть ошибку или пустой массив,
        // так как запрос к API без токена, скорее всего, не вернет нужных данных и вызовет ошибку там.
        // throw new Error('Authentication token not found, cannot fetch chats.'); // Или вернуть []
    }

    const response = await fetch(absoluteApiChatsRoute, fetchOptions);

    if (!response.ok) {
        let errorMessage = `Ошибка загрузки чатов при запросе к /api/chats (статус: ${response.status})`;
        try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (e) {
            // Оставляем исходное сообщение
        }
        console.error(`fetchChatsForLayout: Error fetching chats: ${errorMessage}`);
        throw new Error('Не удалось загрузить список чатов. Пожалуйста, попробуйте позже.');
    }

    const responseData = await response.json();
    if (!responseData || typeof responseData.chats === 'undefined') {
        console.error(
            'fetchChatsForLayout: /api/chats response does not contain "chats" field or is invalid.',
            responseData
        );
        throw new Error('Получен некорректный ответ от сервера при загрузке чатов.');
    }

    return responseData.chats;
}
