'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ClientUser, UpdateUserPayload, updateUserSchema } from '@chat-app/core';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import TextField from '@mui/material/TextField';
import Alert from '@mui/material/Alert';

import { useAuth } from '@/hooks';

interface UserProfileEditFormProps {
    initialUserData: ClientUser;
}

export function UserProfileEditForm({ initialUserData }: UserProfileEditFormProps) {
    const { updateUser, isLoading } = useAuth();

    const {
        control,
        handleSubmit,
        setError,
        formState: { errors, isDirty, isSubmitting, isSubmitSuccessful },
    } = useForm<UpdateUserPayload>({
        resolver: zodResolver(updateUserSchema),
        defaultValues: {
            username: initialUserData.username || '',
        },
    });

    const onSubmit = async (data: UpdateUserPayload) => {
        try {
            await updateUser(data);
            // Сообщение об успехе будет показано на основе isSubmitSuccessful
        } catch (error: any) {
            const errorMessage = error.message || 'Не удалось обновить профиль.';
            setError('root.serverError', { type: 'server', message: errorMessage });
        }
    };

    return (
        <Box
            component="form"
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            sx={{ mt: 1, width: '100%', maxWidth: '600px' }}
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
            <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={!isDirty || isSubmitting}
                sx={{ mt: 3, mb: 2 }}
                startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
            >
                {isLoading ? 'Сохранение...' : 'Сохранить изменения'}
            </Button>
        </Box>
    );
}
