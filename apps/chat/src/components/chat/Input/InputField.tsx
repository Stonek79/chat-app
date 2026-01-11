import type { RefObject } from 'react'
import { Box, InputBase, IconButton } from '@mui/material';
import { Controller, type Control } from 'react-hook-form';
import { useSocketConnection } from '@/hooks';
import { Close } from '@mui/icons-material';
import MoodIcon from '@mui/icons-material/Mood';
import type { DisplayMessage } from '@chat-app/core';

interface FormValues {
    message: string;
}

interface InputFieldProps {
    control: Control<FormValues>;
    inputRef?: RefObject<HTMLInputElement | null>;
    messageToEdit: DisplayMessage | null;
    handleCancelEdit: () => void;
    handleSubmitMessage: () => void;
}

export const InputField = ({
    control,
    inputRef,
    messageToEdit,
    handleCancelEdit,
    handleSubmitMessage,
}: InputFieldProps) => {
    const { isConnected } = useSocketConnection();

    return (
        <Box
            sx={{
                flex: 1,
                mx: 1,
                px: 1.5,
                py: 0.5,
                backgroundColor: 'background.paper',
                borderRadius: '20px',
                display: 'flex',
                alignItems: 'center',
            }}
        >
            <Controller
                name="message"
                control={control}
                render={({ field }) => (
                    <InputBase
                        {...field}
                        ref={inputRef}
                        sx={{ flex: 1 }}
                        placeholder="Write a message..."
                        disabled={!isConnected}
                        endAdornment={
                            messageToEdit && (
                                <IconButton onClick={handleCancelEdit} size="small">
                                    <Close fontSize="small" />
                                </IconButton>
                            )
                        }
                        onKeyDown={e => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmitMessage();
                            }
                        }}
                    />
                )}
            />
            <IconButton sx={{ p: '10px' }} aria-label="emoji">
                <MoodIcon />
            </IconButton>
        </Box>
    );
};
