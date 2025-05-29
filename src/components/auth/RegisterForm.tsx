'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useAuth } from '@/hooks';
import { LOGIN_PAGE_ROUTE } from '@/constants';
import Box from '@mui/material/Box';
import { UsernameField, EmailField, PasswordField } from './fields';
import { SubmitButton, AuthErrorAlert, AuthRedirectLink } from './common';

// TODO: переписать на серверный компонент, абрать хуки в дочерние компоненты
export function RegisterForm() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const auth = useAuth();

    useEffect(() => {
        return () => {
            auth.clearAuthError?.();
        };
    }, [auth.clearAuthError]);

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        auth.clearAuthError?.();

        if (!auth.register) {
            console.error('Функция регистрации не доступна в AuthProvider.');
            return;
        }

        try {
            // auth.register в AuthProvider обрабатывает редирект
            await auth.register({ username, email, password });
        } catch (err: any) {
            console.error('Ошибка при вызове auth.register из RegisterForm:', err.message);
        }
    };

    return (
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1, width: '100%' }}>
            <UsernameField
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoFocus
                error={!!auth.authError} // Подсветка при общей ошибке
                id="username-register"
            />
            <EmailField
                value={email}
                onChange={e => setEmail(e.target.value)}
                error={!!auth.authError}
                id="email-register"
            />
            <PasswordField
                value={password}
                onChange={e => setPassword(e.target.value)}
                id="password-register"
                autoCompletePolicy="new-password"
                error={!!auth.authError}
            />
            <AuthErrorAlert />
            <SubmitButton isLoading={auth.isLoading} loadingText="Регистрация...">
                Зарегистрироваться
            </SubmitButton>
            <AuthRedirectLink text="Уже есть аккаунт?" linkText="Войти" href={LOGIN_PAGE_ROUTE} />
        </Box>
    );
}
