'use client';

import Alert, { AlertProps } from '@mui/material/Alert';

import { useAuth } from '@/hooks';

interface AuthErrorAlertProps extends Omit<AlertProps, 'severity' | 'children'> {}
// Если мы хотим позволить передавать другие AlertProps, можно использовать такой тип

export function AuthErrorAlert(props: AuthErrorAlertProps) {
    const { error: authError } = useAuth();

    if (!authError) {
        return null;
    }

    const errorMessage =
        typeof authError === 'string'
            ? authError
            : authError.message || Object.values(authError).flat()[0] || null;

    return (
        <Alert severity="error" sx={{ width: '100%', mt: 2, mb: 1, ...props.sx }} {...props}>
            {errorMessage}
        </Alert>
    );
}
