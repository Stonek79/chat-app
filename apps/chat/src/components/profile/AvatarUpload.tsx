'use client';

import { ChangeEvent, useState, useRef, MouseEvent } from 'react';
import {
    Avatar,
    Box,
    ButtonBase,
    CircularProgress,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useAvatar, useAuth } from '@/hooks';
import { ConfirmationModal } from '../common';

export const AvatarUpload = () => {
    const { user } = useAuth();
    const { isUploading, isDeleting, uploadAvatar, deleteAvatar } = useAvatar();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const isLoading = isUploading || isDeleting;

    const handleMenuOpen = (event: MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            uploadAvatar(file);
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    const handleAvatarClick = (event: MouseEvent<HTMLElement>) => {
        if (user?.avatarUrl) {
            handleMenuOpen(event);
        } else {
            triggerFileInput();
        }
    };

    const handleReplace = () => {
        handleMenuClose();
        triggerFileInput();
    };

    const handleDeleteRequest = () => {
        handleMenuClose();
        setIsModalOpen(true);
    };

    const handleDeleteConfirm = () => {
        setIsModalOpen(false);
        deleteAvatar();
    };

    if (!user) return null;

    return (
        <>
            <Box sx={{ position: 'relative', display: 'inline-block' }}>
                <ButtonBase
                    onClick={handleAvatarClick}
                    disabled={isLoading}
                    sx={{ borderRadius: '50%', p: 0 }}
                >
                    <Avatar
                        src={user.avatarUrl ?? ''}
                        alt={user.username}
                        sx={{
                            width: 80,
                            height: 80,
                            opacity: isLoading ? 0.5 : 1,
                        }}
                    >
                        {user.username.charAt(0).toUpperCase()}
                    </Avatar>
                </ButtonBase>
                {isLoading && (
                    <CircularProgress
                        size={80}
                        sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            zIndex: 1,
                        }}
                    />
                )}
            </Box>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                hidden
                disabled={isLoading}
            />
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
                <MenuItem onClick={handleReplace}>
                    <ListItemIcon>
                        <EditIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Заменить</ListItemText>
                </MenuItem>
                <MenuItem onClick={handleDeleteRequest}>
                    <ListItemIcon>
                        <DeleteIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Удалить</ListItemText>
                </MenuItem>
            </Menu>

            <ConfirmationModal
                open={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                title="Удалить аватар?"
                description="Это действие нельзя будет отменить. Вы уверены, что хотите удалить свой аватар?"
                confirmButtonText="Удалить"
            />
        </>
    );
};
