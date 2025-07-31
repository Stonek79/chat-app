'use client';

import { useForm, Controller } from 'react-hook-form';
import { Box, IconButton, InputBase } from '@mui/material';
import { AttachFile, Close, Send } from '@mui/icons-material';
import MoodIcon from '@mui/icons-material/Mood';
import { useEffect, useRef } from 'react';
import { ReplyPreview } from './ReplyPreview';
import { Stack } from '@mui/material';
import useChatStore from '@/store/chatStore';
import { shallow } from 'zustand/shallow';
import { useSocketConnection } from '@/hooks';

interface FormValues {
    message: string;
}

export const ChatContentInput = () => {
    const { handleSubmit, control, reset, watch, setValue } = useForm<FormValues>({
        defaultValues: {
            message: '',
        },
    });

    const { isConnected } = useSocketConnection();

    const { editMessage, sendMessage, messageToEdit, setMessageToEdit } = useChatStore(
        state => ({
            editMessage: state.editMessage,
            sendMessage: state.sendMessage,
            messageToEdit: state.activeChat.messageToEdit,
            setMessageToEdit: state.setMessageToEdit,
        }),
        shallow
    );

    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (messageToEdit) {
            setValue('message', messageToEdit.content);
            // focus on input
            inputRef.current?.focus();
        } else {
            setValue('message', '');
        }
    }, [messageToEdit, setValue]);

    const messageValue = watch('message');

    const handleCancelEdit = () => {
        setMessageToEdit(null);
        reset();
    };

    const onSubmit = (data: FormValues) => {
        if (data.message.trim()) {
            if (messageToEdit) {
                // Если редактируем, вызываем onEditMessage
                editMessage(messageToEdit.id, data.message.trim());
            } else {
                // Иначе - onSendMessage
                sendMessage(data.message.trim());
            }
            reset();
        }
    };

    return (
        <Stack sx={{ flexShrink: 0 }}>
            <ReplyPreview />
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
        </Stack>
    );
};
