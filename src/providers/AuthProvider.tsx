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
} from '@/constants';
import { AuthContext } from '@/contexts';
import { ClientUser, LoginCredentials, RegisterCredentials, UpdateUserPayload } from '@/types';

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
    const [user, setUser] = useState<ClientUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [authError, setAuthError] = useState<string | null>(null);
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
            const data = await response.json();

            if (response.ok && data.user) {
                setUser(data.user);
            } else {
                setUser(null);
                if (data.message) {
                    if (response.status !== 401) {
                        setAuthError(data.message);
                        toast.error(data.message);
                    }
                }
            }
        } catch (error) {
            console.error('Ошибка проверки статуса аутентификации:', error);
            setUser(null);
            setAuthError('Не удалось проверить статус аутентификации. Проверьте соединение.');
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
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(credentials),
                ...fetchOptions,
            });
            const data = await response.json();
            if (response.ok && data.user) {
                setUser(data.user);
                router.push(returnTo || HOME_PAGE_ROUTE);
                return data.user as ClientUser;
            } else {
                const errorMessage =
                    data.message || 'Ошибка входа. Пожалуйста, проверьте свои данные.';
                setAuthError(errorMessage);
                toast.error(errorMessage);
                return null;
            }
        } catch (error: unknown) {
            console.error('Сетевая ошибка или ошибка обработки при входе:', error);
            const errorMessage =
                error instanceof Error ? error.message : 'Произошла неизвестная ошибка при входе.';
            if (!authError) {
                setAuthError(errorMessage);
            }
            toast.error(errorMessage);
            setUser(null);
            return null;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        setIsLoading(true);
        clearAuthError();
        try {
            await fetch(API_AUTH_LOGOUT_ROUTE, { method: 'POST', ...fetchOptions });
        } catch (error) {
            console.error('Ошибка при вызове /api/auth/logout на клиенте:', error);
        }
        setUser(null);
        await checkAuthStatus();
    };

    const register = async (credentials: RegisterCredentials) => {
        setIsLoading(true);
        clearAuthError();
        try {
            const response = await fetch(API_AUTH_REGISTER_ROUTE, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(credentials),
                ...fetchOptions,
            });
            const data = await response.json();
            if (response.ok) {
                console.log('Регистрация успешна, проверьте email:', data);
                router.push(LOGIN_PAGE_ROUTE + '?registrationSuccess=true');
            } else {
                const errorMessage = data.message || 'Ошибка регистрации.';
                setAuthError(errorMessage);
                toast.error(errorMessage);
                throw new Error(errorMessage);
            }
        } catch (error: unknown) {
            console.error('Сетевая ошибка или ошибка обработки при регистрации:', error);
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : 'Произошла неизвестная ошибка при регистрации.';
            if (!authError) {
                setAuthError(errorMessage);
            }
            toast.error(errorMessage);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const updateUser = async (payload: UpdateUserPayload): Promise<ClientUser | null> => {
        if (!user) {
            setAuthError('Пользователь не аутентифицирован для обновления.');
            return null;
        }
        setIsLoading(true);
        clearAuthError();
        try {
            const response = await fetch(API_AUTH_USER_ROUTE, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
                ...fetchOptions,
            });
            const data = await response.json();
            if (response.ok && data.user) {
                setUser(data.user);
                toast.success('Профиль успешно обновлен!');
                return data.user as ClientUser;
            } else {
                const errorMessage = data.message || 'Ошибка обновления пользователя.';
                setAuthError(errorMessage);
                toast.error(errorMessage);
                return null;
            }
        } catch (error: unknown) {
            console.error(
                'Сетевая ошибка или ошибка обработки при обновлении пользователя:',
                error
            );
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : 'Произошла неизвестная ошибка при обновлении.';
            if (!authError) {
                setAuthError(errorMessage);
            }
            toast.error(errorMessage);
            return null;
        } finally {
            setIsLoading(false);
        }
    };

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
        ]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
