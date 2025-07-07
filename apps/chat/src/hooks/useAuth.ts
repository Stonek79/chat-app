import { useContext } from 'react';
import type { AuthContextType } from '@chat-app/core';
import { AuthContext } from '@/contexts';

export const useAuth = () => {
    const context = useContext<AuthContextType | undefined>(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
