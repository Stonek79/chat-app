'use client';

import useSWR from 'swr';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { API_AUTH_ME_ROUTE, AuthResponse, UpdateUserPayload, updateUserSchema } from '@chat-app/core';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import TextField from '@mui/material/TextField';
import Alert from '@mui/material/Alert';
import { updateUser } from '@/lib/auth/actions';
import { AvatarUpload } from './AvatarUpload';
import { ThemeSwitcher } from './ThemeSwitcher';
import { ProfileHeader } from './ProfileHeader';
import Typography from '@mui/material/Typography';
import { useEffect } from 'react';

export function UserProfileEditForm() {
    const { data, isLoading, mutate } = useSWR<AuthResponse | null>(API_AUTH_ME_ROUTE);
    const user = data?.user;

    const {
        control,
        handleSubmit,
        setError,
        reset,
        formState: { errors, isDirty, isSubmitting, isSubmitSuccessful },
    } = useForm<UpdateUserPayload>({
        resolver: zodResolver(updateUserSchema),
        defaultValues: {
            username: '',
            avatarUrl: '',
        },
    });

    useEffect(() => {
        if (user) {
            reset({
                username: user.username || '',
                avatarUrl: user.avatarUrl || '',
            });
        }
    }, [user, reset]);

    const onSubmit = async (payload: UpdateUserPayload) => {
        try {
            console.log(payload);
            await updateUser(mutate, data, payload);
        } catch (error: any) {
            const errorMessage = error.message || 'Не удалось обновить профиль.';
            setError('root.serverError', { type: 'server', message: errorMessage });
        }
    };

    if (isLoading) {
        return <CircularProgress />; // Показываем прелоадер, пока грузятся данные пользователя
    }

    return (
        <Box
            sx={{
                flexGrow: 1,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                p: { xs: 2, sm: 3 },
            }}
        >
            <ProfileHeader />

            <Typography variant="h5" sx={{ mb: 3 }}>
                Редактирование профиля
            </Typography>
            <Box
                sx={{
                    width: '100%',
                    maxWidth: { xs: '100%', sm: '600px' },
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            ></Box>
            <Box
                component="form"
                onSubmit={handleSubmit(onSubmit)}
                noValidate
                sx={{ mt: 1, width: '100%', maxWidth: { xs: '100%', sm: '600px' } }}
            >
                {errors.root?.serverError && (
                    <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
                        {errors.root.serverError.message}
                    </Alert>
                )}
                {isSubmitSuccessful && !isDirty && (
                    <Alert severity="success" sx={{ width: '100%', mb: 2 }}>
                        Профиль успешно обновлен!
                    </Alert>
                )}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <AvatarUpload />
                    <Controller
                        name="username"
                        control={control}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                margin="normal"
                                required
                                fullWidth
                                id="username-edit"
                                label="Имя пользователя"
                                name="username"
                                autoComplete="username"
                                error={!!errors.username}
                                helperText={errors.username?.message}
                            />
                        )}
                    />
                </Box>
                <ThemeSwitcher />
                <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    disabled={!isDirty || isSubmitting}
                    sx={{
                        mt: 3,
                        mb: 2,
                        maxWidth: { xs: '100%', sm: '250px' },
                        alignSelf: 'center',
                    }}
                    startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
                >
                    {isSubmitting ? 'Сохранение...' : 'Сохранить изменения'}
                </Button>
            </Box>
        </Box>
    );
}
