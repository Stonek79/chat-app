import { type KeyedMutator } from 'swr';
import type {
    LoginCredentials,
    RegisterCredentials,
    UpdateUserPayload,
    ClientUser,
    AuthResponse,
} from '@chat-app/core';
import {
    API_AUTH_LOGIN_ROUTE,
    API_AUTH_LOGOUT_ROUTE,
    API_AUTH_ME_ROUTE,
    API_AUTH_REGISTER_ROUTE,
    ERROR_MESSAGES,
} from '@chat-app/core';

/**
 * Выполняет вход пользователя в систему.
 * @param credentials - Учетные данные для входа.
 */
export async function login(credentials: LoginCredentials): Promise<ClientUser> {
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
}

/**
 * Выполняет выход пользователя из системы.
 * @param mutate - SWR мутатор для обновления кэша.
 */
export async function logout(mutate: KeyedMutator<AuthResponse | null>): Promise<void> {
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
}

/**
 * Регистрирует нового пользователя.
 * @param credentials - Учетные данные для регистрации.
 */
export async function register(credentials: RegisterCredentials): Promise<void> {
    const response = await fetch(API_AUTH_REGISTER_ROUTE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || ERROR_MESSAGES.INTERNAL_ERROR);
    }
}

/**
 * Обновляет данные пользователя.
 * @param mutate - SWR мутатор для обновления кэша.
 * @param currentData - Текущие данные из SWR кэша.
 * @param payload - Данные для обновления.
 */
export async function updateUser(
    mutate: KeyedMutator<AuthResponse | null>,
    currentData: AuthResponse | null | undefined,
    payload: UpdateUserPayload
): Promise<ClientUser> {
    if (!currentData?.user) {
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
            ...currentData,
            user: {
                ...currentData.user,
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
}
