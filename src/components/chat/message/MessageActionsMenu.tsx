'use client';

import { useState } from 'react';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { Box, IconButton, Menu, MenuItem } from '@mui/material';

import { MessageActionTypeEnum } from '@/constants';
import type { DisplayMessage } from '@/types';

interface MessageActionsMenuProps {
    message: DisplayMessage;
    isAdmin: boolean;
    onEdit: () => void;
    onDelete: () => void;
}

// TODO: Перенести лимит в пользовательские настройки (от 5 до 15 минут)
const MODIFY_MESSAGE_LIMIT_MS = 15 * 60 * 1000;

export const MessageActionsMenu = ({
    message,
    isAdmin,
    onEdit,
    onDelete,
}: MessageActionsMenuProps) => {
    const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);

    const isDeleted = message.actions?.some(
        action => action.type === MessageActionTypeEnum.DELETED
    );

    const canModifyMessage = () => {
        if (isDeleted) return false;
        if (message.contentType === 'SYSTEM') return false;
        if (isAdmin) return true;
        if (message.isCurrentUser) {
            const messageTime = new Date(message.createdAt).getTime();
            const now = new Date().getTime();
            return now <= messageTime + MODIFY_MESSAGE_LIMIT_MS;
        }
        return false;
    };

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
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

    if (!canModifyMessage()) {
        return null;
    }

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
                <MenuItem onClick={handleEdit}>Изменить</MenuItem>
                <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
                    Удалить
                </MenuItem>
            </Menu>
        </Box>
    );
};
