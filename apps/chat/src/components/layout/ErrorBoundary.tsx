'use client';

import { Component, ComponentType, ReactNode } from 'react';
import { Box, Button, Container, Paper, Typography } from '@mui/material';

interface Props {
    children: ReactNode;
    fallback?: ComponentType<{ error: Error; resetError: () => void }>;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

/**
 * Классический Error Boundary компонент для React 19
 * Использует class компонент для совместимости с серверными layout'ами
 */
export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('Error caught by boundary:', error);
        console.error('Component stack:', errorInfo.componentStack);

        // Можно отправить ошибку в сервис аналитики
        if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
            // Здесь можно добавить отправку в Sentry, LogRocket и т.д.
        }
    }

    resetError = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError && this.state.error) {
            // Используем кастомный fallback или дефолтный
            if (this.props.fallback) {
                const FallbackComponent = this.props.fallback;
                return <FallbackComponent error={this.state.error} resetError={this.resetError} />;
            }

            // Дефолтный fallback
            return (
                <Container maxWidth="sm">
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            py: 4,
                        }}
                    >
                        <Paper
                            elevation={3}
                            sx={{
                                p: 4,
                                mb: 4,
                                width: '100%',
                                textAlign: 'center',
                            }}
                        >
                            <Typography variant="h5" component="h2" gutterBottom>
                                Что-то пошло не так
                            </Typography>
                            <Typography variant="body1" paragraph>
                                Произошла ошибка при отображении компонента. Пожалуйста, попробуйте
                                обновить страницу.
                            </Typography>
                            {process.env.NODE_ENV === 'development' && (
                                <Typography variant="body2" color="error" paragraph>
                                    {this.state.error.message}
                                </Typography>
                            )}
                            <Box sx={{ mt: 3 }}>
                                <Button variant="contained" onClick={this.resetError}>
                                    Попробовать снова
                                </Button>
                                <Button
                                    variant="outlined"
                                    onClick={() => window.location.reload()}
                                    sx={{ ml: 2 }}
                                >
                                    Обновить страницу
                                </Button>
                            </Box>
                        </Paper>
                    </Box>
                </Container>
            );
        }

        return this.props.children;
    }
}
