'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { API_AUTH_CONFIRM_ROUTE_PREFIX, LOGIN_PAGE_ROUTE } from '@/constants';

export default function EmailConfirmPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const params = useParams();
    const router = useRouter();
    const token = params.token as string | undefined;

    useEffect(() => {
        if (!token) {
            setError('Токен подтверждения не найден в URL.');
            setIsLoading(false);
            return;
        }

        const confirmEmail = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const response = await fetch(`${API_AUTH_CONFIRM_ROUTE_PREFIX}/${token}`);

                if (response.ok) {
                    // Успех, ожидаем редирект от браузера.
                    // isLoading станет false в finally, и покажется сообщение "Перенаправляем вас..."
                } else {
                    // Явная ошибка от API
                    const data = await response.json();
                    setError(
                        data.message ||
                            'Не удалось подтвердить email. Ссылка может быть недействительной или устаревшей.'
                    );
                }
            } catch (e: unknown) {
                console.error('Ошибка при вызове API подтверждения или обработке ответа:', e);
                // Эта ошибка может быть сетевой или если response.json() упал после response.ok=false.
                // Если error еще не установлен (т.е. response.ok было true, но что-то пошло не так после,
                // или это была сетевая ошибка до получения response), устанавливаем ошибку.
                if (!error) {
                    // Проверяем, не установлена ли уже ошибка из блока 'else'
                    if (e instanceof Error) {
                        setError(e.message || 'Произошла ошибка при обработке вашего запроса.');
                    } else {
                        setError('Произошла неизвестная ошибка при обработке вашего запроса.');
                    }
                }
            } finally {
                setIsLoading(false);
            }
        };

        if (token) {
            confirmEmail();
        }
    }, [token]);

    const handleGoToLogin = () => {
        router.push(LOGIN_PAGE_ROUTE);
    };

    return (
        <Container component="main" maxWidth="sm">
            <Box
                sx={{
                    marginTop: { xs: 6, sm: 8 },
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: { xs: 2, sm: 3 },
                    textAlign: 'center',
                }}
            >
                <Typography component="h1" variant="h4" gutterBottom>
                    Подтверждение Email
                </Typography>

                {isLoading && (
                    <Box sx={{ my: 3 }}>
                        <CircularProgress size={60} />
                        <Typography variant="h6" sx={{ mt: 2 }}>
                            Проверяем ваш токен и обрабатываем запрос...
                        </Typography>
                    </Box>
                )}

                {!isLoading && !error && (
                    <Typography variant="h6" sx={{ mt: 2, color: 'success.main' }}>
                        Email успешно подтвержден! Перенаправляем вас...
                    </Typography>
                )}

                {error && (
                    <Alert severity="error" sx={{ width: '100%', mt: 2, mb: 2, textAlign: 'left' }}>
                        {error}
                    </Alert>
                )}

                {!isLoading && error && (
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleGoToLogin}
                        sx={{ mt: 3, px: 5, py: 1.5 }}
                    >
                        Перейти на страницу входа
                    </Button>
                )}
            </Box>
        </Container>
    );
}
