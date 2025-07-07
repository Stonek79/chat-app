'use client';

import type { DisplayMessage } from '@chat-app/core';
import { ActionType } from '@chat-app/db';
import { Box, Paper, Typography } from '@mui/material';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface DeletedMessageProps {
    message: DisplayMessage;
    currentUserId: string;
}

const formatTime = (date: Date | string) => {
    try {
        return format(new Date(date), 'HH:mm', { locale: ru });
    } catch (error) {
        console.error('Error formatting time:', error);
        return '';
    }
};

export const DeletedMessage = ({ message, currentUserId }: DeletedMessageProps) => {
    const deleteAction = message.actions?.find(action => action.type === ActionType.DELETED);

    // Эта проверка не должна сработать, если компонент используется правильно,
    // но она служит в качестве подстраховки.
    if (!deleteAction) return null;

    const actor = deleteAction.actor;

    // Резервный вариант на случай отсутствия "актора"
    if (!actor) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <Paper
                    elevation={0}
                    sx={{ backgroundColor: 'transparent', color: 'text.secondary' }}
                >
                    <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                        Сообщение было удалено.
                    </Typography>
                </Paper>
            </Box>
        );
    }

    const amIDeleter = actor.id === currentUserId;

    return (
        <Box
            sx={{
                width: '100%',
                display: 'flex',
            }}
        >
            <Paper
                elevation={0}
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: 'transparent',
                    color: 'text.secondary',
                    justifyContent: 'space-between',
                    width: '100%',
                }}
            >
                <Typography component="span" variant="body2" sx={{ fontStyle: 'italic' }}>
                    {amIDeleter ? (
                        'Вы удалили сообщение'
                    ) : (
                        <>
                            Сообщение удалено пользователем <b>{actor.username}</b>
                        </>
                    )}
                </Typography>
                <Typography
                    variant="caption"
                    sx={{
                        opacity: 0.7,
                        ml: 1,
                        mr: 3.5,
                    }}
                >
                    {formatTime(deleteAction.createdAt)}
                </Typography>
            </Paper>
        </Box>
    );
};
