import { ChatContent } from '@/components';
import { LOGIN_PAGE_ROUTE } from '@/constants/clientRoutes';
import { getCurrentUserFromSessionCookie } from '@/lib';
import { redirect } from 'next/navigation';

interface ChatPageProps {
    params: {
        chatId: string;
    };
}

/**
 * Страница конкретного чата.
 * Отображает сообщения чата и позволяет отправлять новые.
 * @param {ChatPageProps} props - Свойства компонента, включая chatId из URL.
 * @returns {JSX.Element} Компонент страницы чата.
 */
export default async function ChatPage({ params }: ChatPageProps) {
    const { chatId } = await params;
    const currentUser = await getCurrentUserFromSessionCookie();
    if (!currentUser) {
        redirect(LOGIN_PAGE_ROUTE);
    }

    const isAdmin = currentUser.role === 'ADMIN';

    return <ChatContent chatId={chatId} currentUserId={currentUser.id} isAdmin={isAdmin} />;
}
