'use client';

import { Control, useWatch } from 'react-hook-form';
import { CircularProgress, IconButton } from '@mui/material';
import { Send } from '@mui/icons-material';

interface SendMessageButtonProps {
    control: Control<{ message: string }>;
    isConnected: boolean;
    fileToUpload: File | null;
    isUploading: boolean;
}

export const SendMessageButton = ({
    control,
    isConnected,
    fileToUpload,
    isUploading,
}: SendMessageButtonProps) => {
    const messageValue = useWatch({
        control,
        name: 'message',
        defaultValue: '',
    });

    const isDisabled = !isConnected || (!messageValue.trim() && !fileToUpload) || isUploading;

    return (
        <IconButton color="primary" type="submit" aria-label="send message" disabled={isDisabled}>
            {isUploading ? <CircularProgress size={24} /> : <Send />}
        </IconButton>
    );
};
