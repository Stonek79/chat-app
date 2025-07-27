'use client';

import useSWR from 'swr';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    LOGIN_PAGE_ROUTE,
    createUserSchema,
    RegisterCredentials,
    API_AUTH_ME_ROUTE,
} from '@chat-app/core';
import Box from '@mui/material/Box';
import { register } from '@/lib/auth/actions';
import { AuthErrorAlert, AuthRedirectLink, SubmitButton } from './common';
import { EmailField, PasswordField, UsernameField } from './fields';

export function RegisterForm() {
    const { isLoading } = useSWR(API_AUTH_ME_ROUTE);

    const {
        control,
        handleSubmit,
        setError,
        clearErrors,
        formState: { errors },
    } = useForm<RegisterCredentials>({
        resolver: zodResolver(createUserSchema),
        mode: 'onSubmit',
        reValidateMode: 'onSubmit',
    });

    const onSubmit = async (data: RegisterCredentials) => {
        try {
            clearErrors();
            await register(data);
        } catch (error: any) {
            const serverErrors = error.errors || {};
            Object.keys(serverErrors).forEach(key => {
                setError(key as keyof RegisterCredentials, {
                    type: 'server',
                    message: serverErrors[key][0],
                });
            });
        }
    };

    return (
        <Box
            component="form"
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            sx={{ mt: 1, width: '100%' }}
        >
            <Controller
                name="username"
                control={control}
                defaultValue=""
                render={({ field }) => (
                    <UsernameField
                        {...field}
                        onChange={e => {
                            clearErrors('username');
                            field.onChange(e);
                        }}
                        autoFocus
                        id="username-register"
                        error={!!errors.username}
                        helperText={errors.username?.message}
                    />
                )}
            />
            <Controller
                name="email"
                control={control}
                defaultValue=""
                render={({ field }) => (
                    <EmailField
                        {...field}
                        onChange={e => {
                            clearErrors('email');
                            field.onChange(e);
                        }}
                        id="email-register"
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
                        onChange={e => {
                            clearErrors('password');
                            field.onChange(e);
                        }}
                        id="password-register"
                        autoCompletePolicy="new-password"
                        error={!!errors.password}
                        helperText={errors.password?.message}
                    />
                )}
            />
            <AuthErrorAlert errors={errors} />
            <SubmitButton isLoading={isLoading} loadingText="Регистрация...">
                Зарегистрироваться
            </SubmitButton>
            <AuthRedirectLink text="Уже есть аккаунт?" linkText="Войти" href={LOGIN_PAGE_ROUTE} />
        </Box>
    );
}
