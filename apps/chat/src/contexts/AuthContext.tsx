import { createContext } from 'react';
import type { AuthContextType } from '@chat-app/core';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
