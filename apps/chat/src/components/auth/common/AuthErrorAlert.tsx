'use client';

import Alert from '@mui/material/Alert';
import { FieldErrors } from 'react-hook-form';

export function AuthErrorAlert({ errors }: { errors: FieldErrors }) {
    const { message, type } = errors?.root || {};

    if (!message) {
        return null;
    }

    const errorMessage =
        typeof type === 'string' ? message : message || Object.values(message).flat()[0] || null;

    return (
        <Alert severity="error" sx={{ width: '100%', mt: 2, mb: 1 }}>
            {errorMessage}
        </Alert>
    );
}
