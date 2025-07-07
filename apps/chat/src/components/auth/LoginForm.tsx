'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { REGISTER_PAGE_ROUTE, loginSchema, LoginCredentials } from '@chat-app/core';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';

import { useAuth } from '@/hooks';

import { AuthErrorAlert, AuthRedirectLink, SubmitButton } from './common';
import { EmailField, PasswordField } from './fields';

interface LoginFormProps {
    returnTo?: string;
    registrationSuccess?: boolean;
}

export function LoginForm({ returnTo, registrationSuccess }: LoginFormProps) {
    const { login, isLoading, clearAuthError } = useAuth();

    const {
        control,
        handleSubmit,
        setError,
        formState: { errors },
    } = useForm<LoginCredentials>({
        resolver: zodResolver(loginSchema),
        mode: 'onSubmit',
        reValidateMode: 'onSubmit',
    });

    const onSubmit = async (data: LoginCredentials) => {
        try {
            clearAuthError?.();
            await login(data, returnTo);
        } catch (error: unknown) {
            // Обрабатываем общую ошибку, не привязанную к полю
            const errorMessage =
                typeof error === 'object' &&
                error !== null &&
                'message' in error &&
                typeof (error as { message: unknown }).message === 'string'
                    ? (error as { message: string }).message
                    : 'Произошла неизвестная ошибка';

            setError('root.serverError', {
                type: 'server',
                message: errorMessage,
            });
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
                onSubmit={handleSubmit(onSubmit)}
                noValidate
                sx={{ mt: registrationSuccess ? 1 : 3, width: '100%' }}
            >
                <Controller
                    name="email"
                    control={control}
                    defaultValue=""
                    render={({ field }) => (
                        <EmailField
                            {...field}
                            autoFocus
                            id="email-login"
                            error={!!errors.email}
                            helperText={errors.email?.message}
                        />
                    )}
                />
                <Controller
                    name="password"
                    control={control}
                    defaultValue=""
                    render={({ field }) => (
                        <PasswordField
                            {...field}
                            id="password-login"
                            autoCompletePolicy="current-password"
                            error={!!errors.password}
                            helperText={errors.password?.message}
                        />
                    )}
                />
                {errors.root?.serverError && (
                    <Alert severity="error" sx={{ width: '100%', mt: 2 }}>
                        {errors.root.serverError.message}
                    </Alert>
                )}
                <SubmitButton isLoading={isLoading} loadingText="Вход...">
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
