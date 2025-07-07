'use server';

import { headers } from 'next/headers';
import { API_CHATS_ROUTE, PUBLIC_APP_API_URL } from '@chat-app/core';
import { ChatWithDetails } from '@chat-app/core';

export const fetchChat = async (chatId: string) => {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || PUBLIC_APP_API_URL;
    const absoluteApiChatsRoute = `${appUrl}${API_CHATS_ROUTE}`;
    const headerList = await headers();
    const cookieHeader = headerList.get('cookie');

    const fetchOptions: RequestInit = {
        cache: 'no-store',
    };

    if (cookieHeader) {
        fetchOptions.headers = { Cookie: cookieHeader };
    }

    try {
        const response = await fetch(`${absoluteApiChatsRoute}/${chatId}`, fetchOptions);

        if (!response.ok) {
            let errorMessage = 'Ошибка загрузки чата';
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorMessage;
            } catch (e) {
                console.error('Failed to parse error response JSON from API_CHATS_ROUTE:', e);
            }
            throw new Error(errorMessage);
        }

        const { chat } = await response.json();

        return chat as ChatWithDetails;
    } catch (e) {
        console.log(e);
        throw Error();
    }
};
