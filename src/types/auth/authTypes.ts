import { UserRole } from '../user';

// Тип для данных пользователя, которые хранятся на клиенте
export interface ClientUser {
    id: string;
    username: string;
    email: string;
    role: UserRole;
    avatarUrl: string;
}

// Типы для форм
export interface LoginCredentials {
    email: string;
    password?: string;
}

export interface RegisterCredentials {
    username: string;
    email: string;
    password?: string;
}

export interface UpdateUserPayload {
    username?: string;
    // email?: string; // Для будущего расширения
}

export interface AuthContextType {
    user: ClientUser | null;
    isLoading: boolean;
    authError: string | null;
    setAuthError: (error: string | null) => void;
    login: (credentials: LoginCredentials, returnTo?: string) => Promise<ClientUser | null>;
    logout: () => Promise<void>;
    register: (credentials: RegisterCredentials) => Promise<void>;
    checkAuthStatus: () => Promise<void>;
    updateUser?: (payload: UpdateUserPayload) => Promise<ClientUser | null>;
    clearAuthError: () => void;
}
