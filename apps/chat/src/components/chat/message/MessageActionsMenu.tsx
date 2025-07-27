'use client';

import { MouseEvent, useState } from 'react';
import type { DisplayMessage } from '@chat-app/core';
import { ChatParticipantRole } from '@chat-app/db';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { Box, IconButton, Menu, MenuItem } from '@mui/material';

interface MessageActionsMenuProps {
    message: DisplayMessage;
    userRole: ChatParticipantRole;
    isCurrentUserMessage: boolean;
    onEdit: () => void;
    onDelete: () => void;
}

// TODO: Перенести лимит в пользовательские настройки (от 5 до 15 минут)
const MODIFY_MESSAGE_LIMIT_MS = 15 * 60 * 1000;

export const MessageActionsMenu = ({
    message,
    userRole,
    onEdit,
    onDelete,
    isCurrentUserMessage,
}: MessageActionsMenuProps) => {
    const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);

    const isAdminOrOwner =
        userRole === ChatParticipantRole.ADMIN || userRole === ChatParticipantRole.OWNER;

    const canEdit = () => {
        if (!isAdminOrOwner) {
            const messageTime = new Date(message.createdAt).getTime();
            const now = new Date().getTime();
            return now <= messageTime + MODIFY_MESSAGE_LIMIT_MS;
        }

        return true;
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
        onEdit();
        handleMenuClose();
    };

    const handleDelete = () => {
        onDelete();
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
