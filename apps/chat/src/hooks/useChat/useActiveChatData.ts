import useChatStore from '@/store/chatStore';
import { shallow } from 'zustand/vanilla/shallow';
/**
 * Хук для получения данных активного чата.
 */
export const useActiveChatData = () => {
    return useChatStore(
        state => ({
            messages: state.activeChat.activeChatMessages,
            participants: state.activeChat.activeChatParticipants,
            details: state.activeChat.activeChatDetails,
            isLoading: state.activeChat.activeChatLoading,
            hasMoreMessages: state.activeChat.hasMoreMessages,
            isLoadingMore: state.isLoadingMore,
        }),
        shallow
    );
};
