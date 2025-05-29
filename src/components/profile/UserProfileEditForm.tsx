'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useAuth } from '@/hooks';
import { ClientUser, UpdateUserPayload } from '@/types';

import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';

interface UserProfileEditFormProps {
    initialUserData: ClientUser;
}

export function UserProfileEditForm({ initialUserData }: UserProfileEditFormProps) {
    const auth = useAuth();
    const [username, setUsername] = useState(initialUserData.username || '');
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [currentAuthError, setCurrentAuthError] = useState<string | null>(null);

    // Синхронизируем локальную ошибку с ошибкой из AuthContext
    useEffect(() => {
        setCurrentAuthError(auth.authError);
    }, [auth.authError]);

    // Синхронизируем username, если initialUserData изменился извне (например, после обновления контекста)
    useEffect(() => {
        setUsername(initialUserData.username || '');
    }, [initialUserData.username]);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!auth.updateUser) return;

        // Очищаем предыдущие ошибки и сообщения
        if (auth.clearAuthError) {
            auth.clearAuthError(); // Очищаем ошибку в AuthContext
        }
        setCurrentAuthError(null); // Очищаем локальную копию ошибки
        setSuccessMessage(null);

        const payload: UpdateUserPayload = { username };

        try {
            await auth.updateUser(payload);
            setSuccessMessage('Имя пользователя успешно обновлено!');
            // AuthProvider должен обновить auth.user, что приведет к обновлению initialUserData в ProfilePage,
            // и затем этот компонент получит новый initialUserData.username через useEffect.
        } catch (error: any) {
            // authError будет установлен в AuthProvider и синхронизирован через useEffect
            // Можно здесь дополнительно установить setCurrentAuthError, если ошибка не дошла до AuthProvider
            // или если auth.updateUser не обрабатывает ошибку в AuthProvider должным образом.
            if (!auth.authError) {
                // Если AuthProvider не установил ошибку
                setCurrentAuthError(
                    error.message || 'Произошла неизвестная ошибка при обновлении.'
                );
            }
            console.error('Ошибка при обновлении профиля в форме:', error);
        }
    };

    return (
        <Box
            component="form"
            onSubmit={handleSubmit}
            noValidate
            sx={{ mt: 1, width: '100%', maxWidth: '600px' }}
        >
            {currentAuthError && (
                <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
                    {currentAuthError}
                </Alert>
            )}
            {successMessage && (
                <Alert severity="success" sx={{ width: '100%', mb: 2 }}>
                    {successMessage}
                </Alert>
            )}
            <TextField
                margin="normal"
                required
                fullWidth
                id="username-edit"
                label="Имя пользователя"
                name="username"
                autoComplete="username"
                value={username}
                onChange={e => {
                    setUsername(e.target.value);
                    // Очищаем сообщения при начале редактирования
                    if (successMessage) setSuccessMessage(null);
                    if (currentAuthError && auth.clearAuthError) auth.clearAuthError();
                    if (currentAuthError) setCurrentAuthError(null);
                }}
                // Можно добавить error и helperText, если API возвращает специфичные ошибки для username
                // error={!!(currentAuthError && currentAuthError.toLowerCase().includes('username'))}
                // helperText={ (currentAuthError && currentAuthError.toLowerCase().includes('username')) ? currentAuthError : ''}
            />
            <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={auth.isLoading || username === initialUserData.username}
                sx={{ mt: 3, mb: 2 }}
                startIcon={auth.isLoading ? <CircularProgress size={20} color="inherit" /> : null}
            >
                {auth.isLoading ? 'Сохранение...' : 'Сохранить изменения'}
            </Button>
        </Box>
    );
}
