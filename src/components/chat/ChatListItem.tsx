'use client';

import { useState, memo } from 'react';
import { Box, Typography, Paper, IconButton, Menu, MenuItem, Avatar } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import CheckIcon from '@mui/icons-material/Check';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { DisplayMessage } from '@/types';
import { MessageActionTypeEnum } from '@/constants';

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
const ChatListItemComponent = ({
    message,
    currentUserId,
    isAdmin,
    onEdit,
    onDelete,
}: MessageItemProps) => {
    const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);

    const isCurrentUser =
        message.isCurrentUser !== undefined
            ? message.isCurrentUser
            : message.sender && message.sender.id === currentUserId;

    const isSystemMessage = message.contentType === 'SYSTEM';

    // Проверяем, удалено ли сообщение
    const deleteAction = message.actions?.find(
        action => action.type === MessageActionTypeEnum.DELETED
    );

    // TODO проверить корректность работы с датами, дополнить конфиг пользователя для установки времени редактирования и удаления сообщения от 5 до 15 минут.
    // Админ может удалять и редактировать сообщения любого пользователя в любое время без ограничений.
    const modifyMessageLimit = new Date(message.createdAt).getTime() + 15 * 60 * 1000;

    const canModifyMessage = () => {
        if (deleteAction) return false;
        if (isSystemMessage) return false;
        if (isAdmin) return true;
        if (isCurrentUser) {
            const now = new Date().getTime();
            return now <= modifyMessageLimit;
        }
        return false;
    };

    const formatTime = (date: Date | string) => {
        try {
            return format(new Date(date), 'HH:mm', { locale: ru });
        } catch (error) {
            console.error('Error formatting time:', error);
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
        if (message.id) {
            onDelete(message.id);
        }
        handleMenuClose();
    };

    const renderMessageContent = () => {
        if (deleteAction) {
            return (
                <Typography variant="body2" color="text.secondary" fontStyle="italic">
                    Сообщение удалено
                </Typography>
            );
        }

        switch (message.contentType) {
            case 'IMAGE':
                return (
                    <Box
                        component="img"
                        src={message.mediaUrl ?? ''}
                        alt="Изображение"
                        sx={{
                            maxWidth: '100%',
                            maxHeight: '300px',
                            borderRadius: 1,
                            mt: 1,
                        }}
                    />
                );
            case 'SYSTEM':
                return (
                    <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                        {message.content}
                    </Typography>
                );
            default:
                return <Typography variant="body2">{message.content}</Typography>;
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

    const renderMessageStatus = () => {
        if (!isCurrentUser || !message.id || isSystemMessage || deleteAction) {
            return null;
        }

        const readByAll =
            message.readReceipts &&
            message.readReceipts.length > 0 &&
            message.readReceipts.every(r => r.readAt);

        const readBySome =
            message.readReceipts &&
            message.readReceipts.length > 0 &&
            message.readReceipts.some(r => r.readAt);

        const readByOthers = message.readReceipts?.some(
            receipt => receipt.userId !== currentUserId
        );

        if (readByOthers) {
            return <DoneAllIcon fontSize="inherit" color="info" />;
        } else if (readByAll) {
            return <DoneAllIcon fontSize="inherit" color="success" />;
        } else if (readBySome) {
            return <DoneAllIcon fontSize="inherit" />;
        } else {
            return <CheckIcon fontSize="inherit" />;
        }
    };

    const renderTimestampAndStatus = () => {
        if (deleteAction) {
            const actor = deleteAction.actor;

            if (!actor) {
                return (
                    <Typography variant="body2" color="text.secondary" fontStyle="italic">
                        Сообщение было удалено.
                    </Typography>
                );
            }

            const amIDeleter = actor.id === currentUserId;

            return (
                <>
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
                        }}
                    >
                        {formatTime(deleteAction.createdAt)}
                    </Typography>
                </>
            );
        }

        return (
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    mt: 0.5,
                }}
            >
                <Typography
                    variant="caption"
                    sx={{
                        color: isCurrentUser ? 'primary.contrastText' : 'text.secondary',
                        opacity: 0.7,
                        mr: 0.5,
                    }}
                >
                    {message.isEdited && !isSystemMessage && (
                        <Typography component="span" sx={{ fontStyle: 'italic', mr: 0.5 }}>
                            (изм.)
                        </Typography>
                    )}
                    {formatTime(message.createdAt)}
                </Typography>

                {renderMessageStatus()}
            </Box>
        );
    };

    if (deleteAction) {
        const actor = deleteAction.actor;
        const isCurrentUserSender = message.sender && message.sender.id === currentUserId;

        // Резервный вариант на случай некорректных данных
        if (!actor) {
            return (
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                    <Paper
                        elevation={0}
                        sx={{ p: 1.5, backgroundColor: 'transparent', color: 'text.secondary' }}
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
                    display: 'flex',
                    justifyContent: isSystemMessage
                        ? 'center'
                        : isCurrentUserSender
                          ? 'flex-end'
                          : 'flex-start',
                    mb: 2,
                }}
            >
                <Paper
                    elevation={0}
                    sx={{
                        p: 1.5,
                        display: 'flex',
                        alignItems: 'center',
                        backgroundColor: 'transparent',
                        color: 'text.secondary',
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
                        }}
                    >
                        {formatTime(deleteAction.createdAt)}
                    </Typography>
                </Paper>
            </Box>
        );
    }

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
            }}
        >
            <Box sx={{ order: isCurrentUser ? 2 : 1, display: 'flex' }}>
                {!isCurrentUser && !isSystemMessage && (
                    <Avatar
                        src={message.sender?.avatarUrl ?? undefined}
                        alt={message.sender?.username ?? 'U'}
                        sx={{ width: 40, height: 40, mr: 1 }}
                    />
                )}
                <Paper
                    elevation={isCurrentUser ? 3 : 1}
                    sx={{
                        p: 1.5,
                        width: 'fit-content',
                        maxWidth: '70%',
                        bgcolor: isCurrentUser ? 'primary.main' : 'background.paper',
                        color: isCurrentUser ? 'primary.contrastText' : 'text.primary',
                        borderRadius: isCurrentUser ? '12px 12px 0 12px' : '12px 12px 12px 0',
                        position: 'relative',
                        opacity: deleteAction ? 0.7 : 1,
                    }}
                >
                    {!isCurrentUser && !isSystemMessage && (
                        <Typography
                            variant="caption"
                            sx={{
                                fontWeight: 'bold',
                                color: isCurrentUser ? 'primary.contrastText' : 'text.secondary',
                            }}
                        >
                            {message.sender.username}
                        </Typography>
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
                        {renderTimestampAndStatus()}
                    </Box>

                    {canModifyMessage() && (
                        <Menu
                            anchorEl={menuAnchorEl}
                            open={Boolean(menuAnchorEl)}
                            onClose={handleMenuClose}
                            slotProps={{
                                paper: {
                                    style: {
                                        width: '140px',
                                    },
                                },
                            }}
                        >
                            <MenuItem onClick={handleEdit}>Изменить</MenuItem>
                            <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
                                Удалить
                            </MenuItem>
                        </Menu>
                    )}
                </Paper>
                {canModifyMessage() && (
                    <IconButton
                        size="small"
                        onClick={handleMenuOpen}
                        sx={{
                            order: isCurrentUser ? 1 : 2,
                            alignSelf: 'flex-start',
                            visibility: menuAnchorEl ? 'visible' : 'hidden',
                            '@media (hover: hover)': {
                                '.MuiBox-root:hover &': {
                                    visibility: 'visible',
                                },
                            },
                        }}
                    >
                        <MoreVertIcon fontSize="small" />
                    </IconButton>
                )}
            </Box>
        </Box>
    );
};

export const ChatListItem = memo(ChatListItemComponent);
