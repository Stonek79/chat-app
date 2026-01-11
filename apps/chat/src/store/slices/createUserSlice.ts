import { StateCreator } from 'zustand';
import { ChatStore, UserSlice } from '../types';

export const createUserSlice: StateCreator<ChatStore, [], [], UserSlice> = (set) => ({
    currentUser: null,
    isLoading: true,
    error: null,
    setCurrentUser: (user) => set({ currentUser: user, isLoading: false }),
    setAuthLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error }),
});
