'use client';

import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import {
    API_AUTH_LOGIN_ROUTE,
    API_AUTH_LOGOUT_ROUTE,
    API_AUTH_ME_ROUTE,
    API_AUTH_REGISTER_ROUTE,
    API_AUTH_USER_ROUTE,
    HOME_PAGE_ROUTE,
    LOGIN_PAGE_ROUTE,
} from '@chat-app/core';
import {
    ClientUser,
    LoginCredentials,
    RegisterCredentials,
    UpdateUserPayload,
} from '@chat-app/core';

import { AuthContext } from '@/contexts';

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
    const [user, setUser] = useState<ClientUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [authError, setAuthError] = useState<string | { [key: string]: string[] } | null>(null);
    const router = useRouter();

    const fetchOptions: RequestInit = {
        cache: 'no-store',
        credentials: 'include',
    };

    const clearAuthError = useCallback(() => {
        setAuthError(null);
    }, []);

    const checkAuthStatus = useCallback(async () => {
        setIsLoading(true);
        clearAuthError();
        try {
            const response = await fetch(API_AUTH_ME_ROUTE, fetchOptions);

            if (response.ok) {
                const data = await response.json();
                setUser(data.user);
            } else {
                setUser(null);

                // Если ошибка не 401, а, например, 500, это проблема, которую стоит сообщить.
                if (response.status !== 401) {
                    const errorData = await response.json();
                    const message =
                        errorData?.message || 'Произошла ошибка на сервере. Попробуйте позже.';
                    setAuthError(message);
                    toast.error(message);
                }
            }
        } catch (error) {
            console.error('Ошибка проверки статуса аутентификации:', error);
            setUser(null);
            // Эта ошибка, скорее всего, сетевая. Сообщаем пользователю.
            setAuthError('Не удалось подключиться к серверу. Проверьте ваше соединение.');
            toast.error('Не удалось подключиться к серверу. Проверьте ваше соединение.');
        } finally {
            setIsLoading(false);
        }
    }, [router, clearAuthError]);

    useEffect(() => {
        checkAuthStatus();
    }, []);

    const login = async (
        credentials: LoginCredentials,
        returnTo?: string
    ): Promise<ClientUser | null> => {
        setIsLoading(true);
        clearAuthError();
        try {
            const response = await fetch(API_AUTH_LOGIN_ROUTE, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credentials),
                ...fetchOptions,
            });
            const data = await response.json();
            if (response.ok && data.user) {
                setUser(data.user);
                router.push(returnTo || HOME_PAGE_ROUTE);
                return data.user as ClientUser;
            }
            throw data; // Пробрасываем ошибку для формы
        } catch (error: unknown) {
            // Этот блок теперь ловит и сетевые ошибки, и ошибки от API
            console.error('Ошибка при входе:', error);
            // Пробрасываем ошибку дальше, чтобы форма ее обработала
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        setIsLoading(true);
        clearAuthError();
        try {
            await fetch(API_AUTH_LOGOUT_ROUTE, { method: 'POST', ...fetchOptions });
            setUser(null);
            router.push(LOGIN_PAGE_ROUTE);
        } catch (error) {
            console.error('Ошибка при вызове /api/auth/logout на клиенте:', error);
            toast.error('Не удалось выйти из системы. Попробуйте снова.');
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (credentials: RegisterCredentials) => {
        setIsLoading(true);
        clearAuthError();
        try {
            const response = await fetch(API_AUTH_REGISTER_ROUTE, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credentials),
                ...fetchOptions,
            });

            const data = await response.json();
            if (response.ok) {
                console.log('Регистрация успешна, проверьте email:', data);
                router.push(LOGIN_PAGE_ROUTE + '?registrationSuccess=true');
                return; // Успешный выход
            }
            throw data; // Пробрасываем ошибку для формы
        } catch (error: unknown) {
            console.error('Ошибка при регистрации:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const updateUser = async (payload: UpdateUserPayload): Promise<ClientUser> => {
        if (!user) {
            // Эта ошибка не должна происходить в нормальном потоке, но для безопасности
            throw new Error('Пользователь не аутентифицирован для обновления.');
        }
        setIsLoading(true);
        clearAuthError();
        try {
            const response = await fetch(API_AUTH_USER_ROUTE, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                ...fetchOptions,
            });
            const data = await response.json();
            if (response.ok && data.user) {
                setUser(data.user);
                toast.success('Профиль успешно обновлен!');
                return data.user as ClientUser;
            }
            throw data; // Пробрасываем ошибку для формы
        } catch (error: unknown) {
            console.error('Ошибка при обновлении пользователя:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const mutate = useCallback(async () => {
        await checkAuthStatus();
    }, [checkAuthStatus]);

    const value = useMemo(
        () => ({
            user,
            isLoading,
            authError,
            setAuthError,
            login,
            logout,
            register,
            checkAuthStatus,
            updateUser,
            clearAuthError,
            mutate,
        }),
        [
            user,
            isLoading,
            authError,
            setAuthError,
            login,
            logout,
            register,
            checkAuthStatus,
            updateUser,
            clearAuthError,
            mutate,
        ]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
