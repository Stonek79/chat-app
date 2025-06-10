'use client';

import {
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Button,
} from '@mui/material';

interface ConfirmationModalProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmButtonText?: string;
    cancelButtonText?: string;
}

export const ConfirmationModal = ({
    open,
    onClose,
    onConfirm,
    title,
    description,
    confirmButtonText = 'Подтвердить',
    cancelButtonText = 'Отмена',
}: ConfirmationModalProps) => {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            aria-labelledby="confirmation-dialog-title"
            aria-describedby="confirmation-dialog-description"
        >
            <DialogTitle id="confirmation-dialog-title">{title}</DialogTitle>
            <DialogContent>
                <DialogContentText id="confirmation-dialog-description">
                    {description}
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="primary">
                    {cancelButtonText}
                </Button>
                <Button onClick={onConfirm} color="error" autoFocus>
                    {confirmButtonText}
                </Button>
            </DialogActions>
        </Dialog>
    );
};
