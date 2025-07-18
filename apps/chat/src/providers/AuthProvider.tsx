'use client';

import { useCallback, useMemo } from 'react';
import type { PropsWithChildren } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import type {
    LoginCredentials,
    RegisterCredentials,
    UpdateUserPayload,
    ClientUser,
    AuthResponse,
    AuthContextType,
} from '@chat-app/core';
import {
    API_AUTH_LOGIN_ROUTE,
    API_AUTH_LOGOUT_ROUTE,
    API_AUTH_ME_ROUTE,
    API_AUTH_REGISTER_ROUTE,
    ERROR_MESSAGES,
    LOGIN_PAGE_ROUTE,
} from '@chat-app/core';
import { AuthContext } from '@/contexts';
import { fetcher } from '@/lib';

export const AuthProvider = ({ children }: PropsWithChildren) => {
    const router = useRouter();
    const { data, error, isLoading, mutate } = useSWR<AuthResponse | null>(
        API_AUTH_ME_ROUTE,
        fetcher,
        {
            shouldRetryOnError: false,
        }
    );

    const login = useCallback(
        async (credentials: LoginCredentials, returnTo?: string): Promise<ClientUser> => {
            const loginUser = async (): Promise<AuthResponse> => {
                const response = await fetch(API_AUTH_LOGIN_ROUTE, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(credentials),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || ERROR_MESSAGES.INVALID_CREDENTIALS);
                }
                return response.json();
            };

            const result = await mutate(loginUser, {
                revalidate: false,
            });

            if (returnTo) {
                router.push(returnTo);
            }

            if (!result?.user) {
                throw new Error('Login failed: user data not available');
            }
            return result.user;
        },
        [mutate, router]
    );

    const logout = useCallback(async () => {
        await mutate(
            async () => {
                await fetch(API_AUTH_LOGOUT_ROUTE, { method: 'POST' });
                return null;
            },
            {
                optimisticData: null,
                populateCache: true,
                revalidate: false,
            }
        );
        router.push(LOGIN_PAGE_ROUTE);
    }, [mutate, router]);

    const register = useCallback(async (credentials: RegisterCredentials) => {
        const response = await fetch(API_AUTH_REGISTER_ROUTE, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || ERROR_MESSAGES.INTERNAL_ERROR);
        }
    }, []);

    const updateUser = useCallback(
        async (payload: UpdateUserPayload): Promise<ClientUser> => {
            if (!data?.user) {
                throw new Error('User not authenticated');
            }
            const updateUserPromise = async (): Promise<AuthResponse> => {
                const response = await fetch(API_AUTH_ME_ROUTE, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || ERROR_MESSAGES.INTERNAL_ERROR);
                }
                return response.json();
            };

            const result = await mutate(updateUserPromise, {
                optimisticData: {
                    ...data,
                    user: {
                        ...data.user,
                        ...payload,
                    },
                },
                rollbackOnError: true,
                revalidate: false,
            });

            if (!result?.user) {
                throw new Error('Update failed: user data not available');
            }
            return result.user;
        },
        [mutate, data]
    );

    const value: AuthContextType = useMemo(
        () => ({
            user: data?.user ?? null,
            isLoading,
            isAuthenticated: !isLoading && !!data?.user,
            error: error || null,
            login,
            logout,
            register,
            updateUser,
            mutate,
        }),
        [data?.user, isLoading, error, login, logout, register, updateUser, mutate]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
