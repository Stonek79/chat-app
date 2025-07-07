'use client';

import Button, { ButtonProps } from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';

interface SubmitButtonProps extends ButtonProps {
    isLoading: boolean;
    loadingText?: string;
}

export function SubmitButton({
    isLoading,
    loadingText,
    children,
    ...props
}: SubmitButtonProps) {
    return (
        <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={isLoading || props.disabled}
            sx={{ mt: 2, mb: 2, ...props.sx }} // Позволяем кастомизировать sx и добавляем отступы по умолчанию
            startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : props.startIcon}
            {...props}
        >
            {isLoading ? loadingText || children : children}
        </Button>
    );
}
