import { ChatContent } from '@/components';
import { LOGIN_PAGE_ROUTE } from '@/constants/clientRoutes';
import { getCurrentUserFromSessionCookie } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { fetchChat } from '@/lib/fetch/fetchChat';

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
    const { chatId } = await params; // Можно также получить через useParams()
    const currentUser = await getCurrentUserFromSessionCookie();
    if (!currentUser) {
        redirect(LOGIN_PAGE_ROUTE);
    }

    // const { messages, sendMessage } = useChat(chatId);
    const chat = await fetchChat(chatId);
    const isAdmin = currentUser.role === 'ADMIN';

    // TODO: Fetch chat details and messages based on chatId
    // TODO: Implement message sending functionality
    // TODO: Handle Socket.IO connections and real-time updates

    return <ChatContent chat={chat} currentUserId={currentUser.id} isAdmin={isAdmin} />;
}
