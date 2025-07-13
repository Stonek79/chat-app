'use client';

import { useForm, Controller } from 'react-hook-form';
import type { FormEvent } from 'react';
import { Box, IconButton, InputBase } from '@mui/material';
import { AttachFile, Send } from '@mui/icons-material';
import MoodIcon from '@mui/icons-material/Mood';

interface MessageInputProps {
    onSendMessage: (content: string) => void;
    isConnected: boolean;
}

interface FormValues {
    message: string;
}

export const MessageInput = ({ onSendMessage, isConnected }: MessageInputProps) => {
    const { handleSubmit, control, reset, watch } = useForm<FormValues>({
        defaultValues: {
            message: '',
        },
    });

    const messageValue = watch('message');

    const onSubmit = (data: FormValues) => {
        if (data.message.trim()) {
            onSendMessage(data.message.trim());
            reset();
        }
    };

    return (
        <Box
            component="form"
            onSubmit={handleSubmit(onSubmit)}
            sx={{
                p: 1,
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'background.default',
                borderTop: '1px solid',
                borderColor: 'divider',
            }}
        >
            <IconButton sx={{ p: '10px' }} aria-label="attach file">
                <AttachFile />
            </IconButton>
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
                            sx={{ flex: 1 }}
                            placeholder="Write a message..."
                            disabled={!isConnected}
                            onKeyDown={e => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSubmit(onSubmit)();
                                }
                            }}
                        />
                    )}
                />
                <IconButton sx={{ p: '10px' }} aria-label="emoji">
                    <MoodIcon />
                </IconButton>
            </Box>
            <IconButton
                color="primary"
                type="submit"
                aria-label="send message"
                disabled={!isConnected || !messageValue.trim()}
            >
                <Send />
            </IconButton>
        </Box>
    );
};
