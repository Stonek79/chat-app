'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks';
import { HOME_PAGE_ROUTE, REGISTER_PAGE_ROUTE } from '@/constants';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import { EmailField, PasswordField } from './fields';
import { SubmitButton, AuthErrorAlert, AuthRedirectLink } from './common';

interface LoginFormProps {
    returnTo?: string;
    registrationSuccess?: boolean;
    onLoginSuccess?: (redirectPath: string) => void;
}

// TODO: переписать на серверный компонент, абрать хуки в дочерние компоненты

export function LoginForm({ returnTo, registrationSuccess, onLoginSuccess }: LoginFormProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const auth = useAuth();
    const router = useRouter();

    useEffect(() => {
        return () => {
            auth.clearAuthError?.();
        };
    }, [auth.clearAuthError]);

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        auth.clearAuthError?.();

        if (!auth.login) {
            console.error('Функция входа не доступна в AuthProvider.');
            return;
        }

        const loggedInUser = await auth.login({ email, password }, returnTo);
        if (loggedInUser) {
            let redirectPath =
                returnTo &&
                returnTo.startsWith('/') &&
                !returnTo.startsWith('//') &&
                !returnTo.includes(':')
                    ? returnTo
                    : HOME_PAGE_ROUTE;
            if (onLoginSuccess) {
                onLoginSuccess(redirectPath);
            } else {
                router.push(redirectPath);
            }
        }
    };

    return (
        <>
            {registrationSuccess && (
                <Alert severity="success" sx={{ width: '100%', mt: 2, mb: 1 }}>
                    Регистрация прошла успешно! Пожалуйста, подтвердите ваш email (если это
                    требуется) и войдите в систему.
                </Alert>
            )}
            <Box
                component="form"
                onSubmit={handleSubmit}
                noValidate
                sx={{ mt: registrationSuccess ? 1 : 3, width: '100%' }}
            >
                <EmailField
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    autoFocus
                    error={!!auth.authError}
                    id="email-login"
                />
                <PasswordField
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    id="password-login"
                    autoCompletePolicy="current-password"
                    error={!!auth.authError}
                />
                <AuthErrorAlert />
                <SubmitButton isLoading={auth.isLoading} loadingText="Вход...">
                    Войти
                </SubmitButton>
                <AuthRedirectLink
                    text="Нет аккаунта?"
                    linkText="Зарегистрироваться"
                    href={REGISTER_PAGE_ROUTE}
                />
            </Box>
        </>
    );
}
