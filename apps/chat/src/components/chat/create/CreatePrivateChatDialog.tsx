'use client';

import { useState } from 'react';
import { Box, Typography, Alert, Avatar, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { UserSelectionList } from './UserSelectionList';
import { BaseCreateDialog } from './BaseCreateDialog';
import { useCreateChat } from '@/hooks/useCreateChat';
import { useAuth } from '@/hooks';
import type { CreateChatPayload } from '@/hooks/useCreateChat';
import type { ClientUser } from '@chat-app/core';

interface CreatePrivateChatDialogProps {
    open: boolean;
    onClose: () => void;
}

/**
 * Диалог для создания секретного чата (приватный чат 1 на 1).
 * Секретный чат создается между двумя участниками без названия.
 */
export function CreatePrivateChatDialog({ open, onClose }: CreatePrivateChatDialogProps) {
    const { user } = useAuth();
    const { createChat, isLoading, error } = useCreateChat();
    const [selectedUser, setSelectedUser] = useState<ClientUser | null>(null);

    const handleToggleUser = (user: ClientUser) => {
        // Toggle selection: if clicking same user, deselect. If new user, replace.
        setSelectedUser(prev => (prev?.id === user.id ? null : user));
    };

    const handleSubmit = async () => {
        if (!selectedUser) {
            return;
        }

        const payload: CreateChatPayload = {
            isGroupChat: false,
            participantIds: [selectedUser.id],
            name: undefined,
        };

        const success = await createChat(payload);
        if (success) {
            setSelectedUser(null);
            onClose();
        }
    };

    const handleClose = () => {
        if (!isLoading) {
            setSelectedUser(null);
            onClose();
        }
    };

    return (
        <BaseCreateDialog
            open={open}
            onClose={handleClose}
            onConfirm={handleSubmit}
            title="Создать секретный чат"
            confirmButtonText="Создать чат"
            isLoading={isLoading}
            isConfirmDisabled={!selectedUser}
            fixedWidth="500px"
        >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Typography variant="body2" color="text.secondary">
                    Выберите пользователя, с которым хотите начать секретный чат.
                </Typography>

                <Box>
                    {selectedUser && (
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 2,
                                p: 2,
                                mb: 2,
                                border: '1px solid',
                                borderColor: 'primary.main',
                                borderRadius: 1,
                                backgroundColor: 'action.selected',
                            }}
                        >
                            <Avatar src={selectedUser.avatarUrl || undefined}>
                                {selectedUser.username.charAt(0).toUpperCase()}
                            </Avatar>
                            <Box sx={{ flexGrow: 1 }}>
                                <Typography variant="body1" fontWeight={500}>
                                    {selectedUser.username}
                                </Typography>
                                {selectedUser.email && (
                                    <Typography variant="caption" color="text.secondary">
                                        {selectedUser.email}
                                    </Typography>
                                )}
                            </Box>
                            <IconButton
                                size="small"
                                onClick={() => setSelectedUser(null)}
                                disabled={isLoading}
                                sx={{ ml: 'auto' }}
                            >
                                <CloseIcon fontSize="small" />
                            </IconButton>
                        </Box>
                    )}

                    <UserSelectionList 
                        selectedUserIds={selectedUser ? new Set([selectedUser.id]) : new Set()}
                        onToggleUser={handleToggleUser}
                        excludeUserIds={user?.id ? [user.id] : []}
                        maxSelection={1}
                        maxHeight={400}
                    />
                </Box>

                {error && (
                    <Alert severity="error" onClose={() => {}}>
                        {error}
                    </Alert>
                )}
            </Box>
        </BaseCreateDialog>
    );
}

