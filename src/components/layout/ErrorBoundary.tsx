'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button, Container, Paper } from '@mui/material';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Компонент для обработки ошибок в React компонентах
 * Предотвращает падение всего приложения при ошибке в отдельном компоненте
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Обновляем состояние, чтобы при следующем рендере показать запасной UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Можно также отправить ошибку в сервис аналитики
    console.error('Ошибка в компоненте:', error);
    console.error('Информация о компоненте:', errorInfo);
  }

  resetErrorBoundary = (): void => {
    this.setState({
      hasError: false,
      error: null
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Если есть пользовательский fallback, используем его
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Иначе показываем стандартный UI для ошибки
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
                Произошла ошибка при отображении компонента. Пожалуйста, попробуйте обновить страницу.
              </Typography>
              <Box sx={{ mt: 3 }}>
                <Button variant="contained" onClick={this.resetErrorBoundary}>
                  Попробовать снова
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
