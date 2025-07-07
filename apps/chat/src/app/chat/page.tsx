import { redirect } from 'next/navigation';
import { LOGIN_PAGE_ROUTE, CHAT_PAGE_ROUTE } from '@chat-app/core';

import { fetchChatsForLayout, getCurrentUserFromSessionCookie } from '@/lib';
import { WelcomePageContent, NoChatsPage } from '@/components';

export default async function ChatRootPage() {
    const user = await getCurrentUserFromSessionCookie();
    if (!user) {
        redirect(LOGIN_PAGE_ROUTE);
    }

    const chats = await fetchChatsForLayout();

    if (chats.length === 0) {
        return <NoChatsPage />;
    }

    const firstChatId = chats[0]?.id;
    
    if (firstChatId) {
        redirect(`${CHAT_PAGE_ROUTE}/${firstChatId}`);
    }

    return <WelcomePageContent />;
}
