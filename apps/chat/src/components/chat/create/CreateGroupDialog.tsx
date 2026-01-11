'use client';

import { useState } from 'react';
import { TextField, Box, Typography, Alert, Chip, Avatar } from '@mui/material';
import { UserSelectionList } from './UserSelectionList';
import { BaseCreateDialog } from './BaseCreateDialog';
import { useCreateChat } from '@/hooks/useCreateChat';
import { useAuth } from '@/hooks';
import type { CreateChatPayload } from '@/hooks/useCreateChat';
import type { ClientUser } from '@chat-app/core';

interface CreateGroupDialogProps {
    open: boolean;
    onClose: () => void;
}

/**
 * Диалог для создания группы (публичного чата с несколькими участниками).
 * Группа всегда имеет название и может содержать множество участников.
 */
export function CreateGroupDialog({ open, onClose }: CreateGroupDialogProps) {
    const { user } = useAuth();
    const { createChat, isLoading, error } = useCreateChat();
    const [groupName, setGroupName] = useState('');
    const [selectedUsers, setSelectedUsers] = useState<Map<string, ClientUser>>(new Map());

    const handleToggleUser = (user: ClientUser) => {
        setSelectedUsers(prev => {
            const newMap = new Map(prev);
            if (newMap.has(user.id)) {
                newMap.delete(user.id);
            } else {
                newMap.set(user.id, user);
            }
            return newMap;
        });
    };

    const handleSubmit = async () => {
        if (!groupName.trim() || selectedUsers.size === 0) {
            return;
        }

        const payload: CreateChatPayload = {
            isGroupChat: true,
            participantIds: Array.from(selectedUsers.keys()),
            name: groupName.trim(),
        };

        const success = await createChat(payload);
        if (success) {
            // Сброс формы
            setGroupName('');
            setSelectedUsers(new Map());
            onClose();
        }
    };

    const handleClose = () => {
        if (!isLoading) {
            setGroupName('');
            setSelectedUsers(new Map());
            onClose();
        }
    };

    const isFormValid = groupName.trim().length > 0 && selectedUsers.size > 0;

    return (
        <BaseCreateDialog
            open={open}
            onClose={handleClose}
            onConfirm={handleSubmit}
            title="Создать группу"
            confirmButtonText="Создать группу"
            isLoading={isLoading}
            isConfirmDisabled={!isFormValid}
            fixedWidth="600px"
        >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <TextField
                    label="Название группы"
                    value={groupName}
                    onChange={e => setGroupName(e.target.value)}
                    fullWidth
                    required
                    placeholder="Введите название группы"
                    error={!groupName.trim() && groupName.length > 0} 
                    helperText={!groupName.trim() && groupName.length > 0 ? 'Название группы обязательно' : ''}
                    autoFocus
                />

                <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        Участники{selectedUsers.size > 0 ? ` (${selectedUsers.size})` : ''}
                    </Typography>

                    {selectedUsers.size > 0 && (
                        <Box
                            sx={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: 1,
                                mb: 2,
                                maxHeight: 100,
                                overflowY: 'auto',
                            }}
                        >
                            {Array.from(selectedUsers.values()).map(user => (
                                <Chip
                                    key={user.id}
                                    avatar={<Avatar src={user.avatarUrl || undefined}>{user.username.charAt(0).toUpperCase()}</Avatar>}
                                    label={user.username}
                                    onDelete={() => handleToggleUser(user)}
                                    size="small"
                                />
                            ))}
                        </Box>
                    )}

                    <UserSelectionList 
                        selectedUserIds={new Set(selectedUsers.keys())}
                        onToggleUser={handleToggleUser}
                        excludeUserIds={user?.id ? [user.id] : []}
                        maxHeight={300}
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

