import useChatStore from '@/store/chatStore';

/**
 * Хук для получения данных списка чатов для сайдбара.
 */
export const useChatList = () => {
    const data = useChatStore(state => ({
        chats: state.chats,
        isLoading: state.isLoading,
    }));
    return data;
};
