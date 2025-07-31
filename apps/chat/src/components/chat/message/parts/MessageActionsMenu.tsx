'use client';

import { MouseEvent, useState } from 'react';
import type { DisplayMessage } from '@chat-app/core';
import { ChatParticipantRole } from '@chat-app/db';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { Box, IconButton, ListItemIcon, ListItemText, Menu, MenuItem } from '@mui/material';
import { Reply } from '@mui/icons-material';
import { shallow } from 'zustand/shallow';
import useChatStore from '@/store/chatStore';

interface MessageActionsMenuProps {
    message: DisplayMessage;
    userRole: ChatParticipantRole;
    isCurrentUserMessage: boolean;
}

// TODO: Перенести лимит в пользовательские настройки (от 5 до 15 минут)
const MODIFY_MESSAGE_LIMIT_MS = 15 * 60 * 1000;

export const MessageActionsMenu = ({
    message,
    userRole,
    isCurrentUserMessage,
}: MessageActionsMenuProps) => {
    const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
    const { setMessageToEdit, deleteMessage, setReplyToMessage } = useChatStore(
        state => ({
            setMessageToEdit: state.setMessageToEdit,
            deleteMessage: state.deleteMessage,
            setReplyToMessage: state.setReplyToMessage,
        }),
        shallow
    );

    const isAdminOrOwner =
        userRole === ChatParticipantRole.ADMIN || userRole === ChatParticipantRole.OWNER;

    const canEdit = () => {
        if (userRole === ChatParticipantRole.ADMIN && isCurrentUserMessage) {
            return true;
        }

        if (isCurrentUserMessage) {
            const messageTime = new Date(message.createdAt).getTime();
            const now = new Date().getTime();
            return now <= messageTime + MODIFY_MESSAGE_LIMIT_MS;
        }

        return false;
    };

    const canDelete = () => {
        // Админ или владелец чата могут удалить любое сообщение
        if (isAdminOrOwner) return true;

        // Автор может удалить свое сообщение
        return isCurrentUserMessage;
    };

    if (!canEdit() && !canDelete()) {
        return null;
    }

    const handleMenuOpen = (event: MouseEvent<HTMLElement>) => {
        setMenuAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setMenuAnchorEl(null);
    };

    const handleEdit = () => {
        setMessageToEdit(message);
        handleMenuClose();
    };

    const handleDelete = () => {
        deleteMessage(message.id);
        handleMenuClose();
    };

    const handleReply = () => {
        setReplyToMessage(message);
        handleMenuClose();
    };

    return (
        <Box className="message-actions-menu">
            <IconButton
                size="small"
                onClick={handleMenuOpen}
                sx={{
                    alignSelf: 'flex-start',
                }}
            >
                <MoreVertIcon fontSize="small" />
            </IconButton>
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
                <MenuItem onClick={handleReply}>
                    <ListItemIcon>
                        <Reply fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Ответить</ListItemText>
                </MenuItem>
                {canEdit() && <MenuItem onClick={handleEdit}>Изменить</MenuItem>}
                {canDelete() && (
                    <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
                        Удалить
                    </MenuItem>
                )}
            </Menu>
        </Box>
    );
};
