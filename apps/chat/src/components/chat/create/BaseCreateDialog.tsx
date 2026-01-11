'use client';

import { ReactNode } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    useTheme,
    useMediaQuery,
} from '@mui/material';

interface BaseCreateDialogProps {
    open: boolean;
    onClose: () => void;
    onConfirm?: () => void;
    title: string;
    children: ReactNode;
    confirmButtonText?: string;
    cancelButtonText?: string;
    isLoading?: boolean;
    isConfirmDisabled?: boolean;
    maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number | string;
    fullWidth?: boolean;
    fixedWidth?: string; // Кастомная фиксированная ширина (например, '70%' или '900px')
}

/**
 * Базовый адаптивный диалог для создания чатов/групп/каналов.
 * Автоматически адаптируется для мобильных устройств (fullScreen на маленьких экранах).
 */
export function BaseCreateDialog({
    open,
    onClose,
    onConfirm,
    title,
    children,
    confirmButtonText = 'Создать',
    cancelButtonText = 'Отмена',
    isLoading = false,
    isConfirmDisabled = false,
    maxWidth = 'sm',
    fullWidth = true,
    fixedWidth,
}: BaseCreateDialogProps) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const handleConfirm = () => {
        if (onConfirm && !isLoading && !isConfirmDisabled) {
            onConfirm();
        }
    };

    // Вычисляем ширину для десктопа
    const desktopWidth =
        typeof maxWidth === 'string'
            ? maxWidth === 'sm'
              ? '500px'
              : maxWidth === 'md'
                ? '600px'
                : 'auto'
            : 'auto';

    // Если fixedWidth задан, используем его, иначе стандартные размеры
    const dialogMaxWidth = fixedWidth ? false : (maxWidth as 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false);

    return (
        <Dialog
            open={open}
            onClose={isLoading ? undefined : onClose}
            maxWidth={dialogMaxWidth}
            fullWidth={!fixedWidth && fullWidth}
            fullScreen={isMobile}
            PaperProps={{
                sx: {
                    margin: { xs: 0, sm: 2 },
                    width: fixedWidth
                        ? { xs: '100%', sm: fixedWidth }
                        : { xs: '100%', sm: '90%', md: 'auto' },
                    maxWidth: fixedWidth
                        ? { xs: '100%', sm: fixedWidth.includes('%') ? 'min(70%, 900px)' : fixedWidth }
                        : { xs: '100%', sm: desktopWidth },
                    height: { xs: '100%', sm: 'auto' },
                    maxHeight: { xs: '100%', sm: '90vh' },
                    borderRadius: { xs: 0, sm: 2 },
                },
            }}
        >
            <DialogTitle
                sx={{
                    pb: { xs: 1, sm: 2 },
                    pt: { xs: 3, sm: 2 },
                    px: { xs: 2, sm: 3 },
                }}
            >
                {title}
            </DialogTitle>
            <DialogContent
                sx={{
                    px: { xs: 2, sm: 3 },
                    pb: { xs: 2, sm: 2 },
                    '&.MuiDialogContent-root': {
                        pt: { xs: 2, sm: 1 },
                    },
                }}
            >
                {children}
            </DialogContent>
            <DialogActions
                sx={{
                    px: { xs: 2, sm: 3 },
                    pb: { xs: 3, sm: 2 },
                    pt: { xs: 1, sm: 1 },
                    gap: 1,
                    flexDirection: { xs: 'column-reverse', sm: 'row' },
                    '& .MuiButton-root': {
                        width: { xs: '100%', sm: 'auto' },
                        minWidth: { xs: 'auto', sm: 64 },
                    },
                }}
            >
                <Button onClick={onClose} disabled={isLoading} fullWidth={isMobile}>
                    {cancelButtonText}
                </Button>
                {onConfirm && (
                    <Button
                        onClick={handleConfirm}
                        variant="contained"
                        disabled={isLoading || isConfirmDisabled}
                        fullWidth={isMobile}
                    >
                        {isLoading ? 'Создание...' : confirmButtonText}
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
}

