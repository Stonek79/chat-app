'use client';

import useChatStore from '@/store/chatStore';
import { shallow } from 'zustand/vanilla/shallow';

/**
 * Хук для доступа к данным аутентификации и экшенам.
 * Теперь является простой оберткой над useChatStore для удобства.
 */
export const useAuth = () => {
    const { user, isLoading } = useChatStore(
        state => ({
            user: state.currentUser,
            isLoading: state.isLoading,
        }),
        shallow
    );

    return {
        user,
        isLoading,
        isAuthenticated: !isLoading && !!user,
    };
};
