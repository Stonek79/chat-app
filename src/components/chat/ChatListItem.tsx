'use client';

import { useState } from 'react';
import { Box, Typography, Paper, IconButton, Menu, MenuItem, Avatar } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import CheckIcon from '@mui/icons-material/Check';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { DisplayMessage } from '@/types';

interface MessageItemProps {
    message: DisplayMessage;
    currentUserId: string;
    isAdmin: boolean;
    onEdit: (message: DisplayMessage) => void;
    onDelete: (messageId: string) => void;
}

/**
 * Компонент для отображения отдельного сообщения в чате
 * Поддерживает различные типы контента и действия с сообщением
 */
export function ChatListItem({
    message,
    currentUserId,
    isAdmin,
    onEdit,
    onDelete,
}: MessageItemProps) {
    const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);

    const isCurrentUser =
        message.isCurrentUser !== undefined
            ? message.isCurrentUser
            : message.sender && message.sender.id === currentUserId;

    const isSystemMessage = message.contentType === 'SYSTEM';

    const modifyMessageLimit = new Date(message.createdAt).getTime() + (10 * 60 * 1000)

    const canModifyMessage = () => {
        if (message.deletedAt) return false;
        if (isSystemMessage) return false;
        if (isAdmin) return true;
        if (isCurrentUser) {
            const now = new Date().getTime();
            return now <= modifyMessageLimit;
        }
        return false;
    };

    const formatMessageTime = (dateValue: Date) => {
        try {
            return format(dateValue, 'HH:mm', { locale: ru });
        } catch (error) {
            console.error('Error formatting message time:', error);
            return '';
        }
    };

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setMenuAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setMenuAnchorEl(null);
    };

    const handleEdit = () => {
        onEdit(message);
        handleMenuClose();
    };

    const handleDelete = () => {
        onDelete(String(message.id));
        handleMenuClose();
    };

    const renderMessageContent = () => {
        if (message.deletedAt) {
            return (
                <Typography variant="body2" color="text.secondary" fontStyle="italic">
                    Сообщение удалено
                </Typography>
            );
        }

        switch (message.contentType) {
            case 'IMAGE':
                return (
                    <Box sx={{ mt: 1 }}>
                        {message.mediaUrl && (
                            <img
                                src={message.mediaUrl}
                                alt={message.content || 'Изображение'}
                                style={{
                                    maxWidth: '100%',
                                    maxHeight: '300px',
                                    borderRadius: '8px',
                                }}
                            />
                        )}
                        {message.content && message.mediaUrl && (
                            <Typography variant="body1" sx={{ mt: 1 }}>
                                {message.content}
                            </Typography>
                        )}
                        {!message.mediaUrl && message.content && (
                            <Typography variant="body1">{message.content}</Typography>
                        )}
                    </Box>
                );

            case 'VIDEO':
                return (
                    <Box sx={{ mt: 1 }}>
                        {message.mediaUrl && (
                            <video
                                controls
                                style={{
                                    maxWidth: '100%',
                                    maxHeight: '300px',
                                    borderRadius: '8px',
                                }}
                            >
                                <source src={message.mediaUrl} />
                                Ваш браузер не поддерживает видео.
                            </video>
                        )}
                        {message.content && message.mediaUrl && (
                            <Typography variant="body1" sx={{ mt: 1 }}>
                                {message.content}
                            </Typography>
                        )}
                        {!message.mediaUrl && message.content && (
                            <Typography variant="body1">{message.content}</Typography>
                        )}
                    </Box>
                );

            case 'TEXT':
            default:
                return (
                    <Typography
                        sx={{
                            overflowWrap: 'break-word',
                            wordBreak: 'break-word',
                            whiteSpace: 'pre-line',
                            hyphens: 'auto',
                        }}
                        variant="body1"
                    >
                        {message.content}
                    </Typography>
                );
        }
    };

    const getSenderName = () => {
        if (isSystemMessage) return 'Система';
        if (message.sender) {
            return message.sender.username || 'Пользователь';
        }
        return 'Пользователь';
    };

    const senderDisplayName = getSenderName();

    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: isSystemMessage
                    ? 'center'
                    : isCurrentUser
                      ? 'flex-end'
                      : 'flex-start',
                mb: 2,
                position: 'relative',
            }}
        >
            <Paper
                elevation={1}
                sx={{
                    p: 1.5,
                    width: isSystemMessage ? 'auto' : 'fit-content',
                    maxWidth: isSystemMessage ? '90%' : '70%',
                    minWidth: '100px',
                    backgroundColor: isSystemMessage
                        ? 'grey.300'
                        : isCurrentUser
                          ? 'primary.light'
                          : 'background.paper',
                    color: isSystemMessage
                        ? 'text.primary'
                        : isCurrentUser
                          ? 'primary.contrastText'
                          : 'text.primary',
                    borderRadius: isCurrentUser ? '12px 12px 0 12px' : '12px 12px 12px 0',
                    position: 'relative',
                    opacity: message.deletedAt ? 0.7 : 1,
                }}
            >
                {!isSystemMessage && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                        {message.sender?.avatarUrl && (
                            <Avatar
                                src={message.sender.avatarUrl}
                                alt={senderDisplayName}
                                sx={{
                                    width: 24,
                                    height: 24,
                                    mr: 1,
                                }}
                            />
                        )}
                        <Typography
                            variant="caption"
                            sx={{
                                fontWeight: 'bold',
                                color: isCurrentUser ? 'primary.contrastText' : 'text.secondary',
                                opacity: 0.8,
                            }}
                        >
                            {senderDisplayName}
                            {message.sender?.role === 'ADMIN' && !isCurrentUser && (
                                <Typography
                                    component="span"
                                    sx={{ ml: 0.5, fontSize: '0.7rem', fontStyle: 'italic' }}
                                >
                                    (админ)
                                </Typography>
                            )}
                        </Typography>

                        {canModifyMessage() && (
                            <IconButton
                                size="small"
                                sx={{
                                    p: 0.2,
                                    color: isCurrentUser ? 'inherit' : 'text.secondary',
                                }}
                                onClick={handleMenuOpen}
                                aria-label="actions"
                                aria-controls={menuAnchorEl ? 'message-actions-menu' : undefined}
                                aria-haspopup="true"
                                aria-expanded={menuAnchorEl ? 'true' : undefined}
                            >
                                <MoreVertIcon fontSize="inherit" />
                            </IconButton>
                        )}
                    </Box>
                )}

                {renderMessageContent()}

                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mt: 0.5,
                        gap: 1,
                    }}
                >
                    <Typography
                        variant="caption"
                        sx={{
                            color: isCurrentUser ? 'primary.contrastText' : 'text.secondary',
                            opacity: 0.7,
                            mr: 1,
                        }}
                    >
                        {message.isEdited && !message.deletedAt && !isSystemMessage && (
                            <Typography component="span" sx={{ fontStyle: 'italic', mr: 0.5 }}>
                                (изм.)
                            </Typography>
                        )}
                        {formatMessageTime(message.createdAt)}
                    </Typography>

                    {!isSystemMessage && isCurrentUser && !message.deletedAt && (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {message.readReceipts && message.readReceipts.length > 0 ? (
                                <DoneAllIcon
                                    fontSize="inherit"
                                    sx={{
                                        color:
                                            message.sender?.role === 'ADMIN'
                                                ? 'secondary.main'
                                                : 'success.light',
                                    }}
                                />
                            ) : (
                                <CheckIcon
                                    fontSize="inherit"
                                    sx={{
                                        color: isCurrentUser
                                            ? 'rgba(255,255,255,0.7)'
                                            : 'text.disabled',
                                    }}
                                />
                            )}
                        </Box>
                    )}
                </Box>

                {canModifyMessage() && (
                    <Menu
                        id="message-actions-menu"
                        anchorEl={menuAnchorEl}
                        open={Boolean(menuAnchorEl)}
                        onClose={handleMenuClose}
                        MenuListProps={{
                            'aria-labelledby': 'actions-button',
                        }}
                    >
                        <MenuItem onClick={handleEdit} disabled={!canModifyMessage()}>
                            Редактировать
                        </MenuItem>
                        <MenuItem
                            onClick={handleDelete}
                            disabled={!canModifyMessage()}
                            sx={{ color: 'error.main' }}
                        >
                            Удалить
                        </MenuItem>
                    </Menu>
                )}
            </Paper>
        </Box>
    );
}
