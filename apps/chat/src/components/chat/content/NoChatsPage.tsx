'use client';

import { useState } from 'react';
import useChatStore from '@/store/chatStore';
import { Button, Typography, Box, Menu, MenuItem } from '@mui/material';
import { shallow } from 'zustand/shallow';
import { CreateGroupDialog, CreatePrivateChatDialog } from '@/components/chat/create';
import AddIcon from '@mui/icons-material/Add';

export const NoChatsPage = () => {
    const { chats, isLoading } = useChatStore(
        state => ({
            chats: state.chats,
            isLoading: state.isLoading,
        }),
        shallow
    );
    const [createGroupDialogOpen, setCreateGroupDialogOpen] = useState(false);
    const [createPrivateChatDialogOpen, setCreatePrivateChatDialogOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    if (isLoading) return null;

    return (
        <>
            {chats?.length > 0 ? (
                <Typography variant="h6" color="text.secondary">
                    Выберите чат, чтобы начать общение.
                </Typography>
            ) : (
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 2,
                    }}
                >
                    <Typography sx={{ textAlign: 'center', fontSize: '2rem' }} variant="h4">
                        У вас пока нет чатов
                    </Typography>
                    <Typography sx={{ textAlign: 'center', fontSize: '1.2rem' }} variant="body1">
                        Создайте новый чат, чтобы начать общение.
                    </Typography>
                    <Button
                        sx={{ width: '100%', mt: 2, maxWidth: 'fit-content' }}
                        variant="contained"
                        color="primary"
                        startIcon={<AddIcon />}
                        onClick={e => setAnchorEl(e.currentTarget)}
                    >
                        Создать чат
                    </Button>
                    <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={() => setAnchorEl(null)}
                        anchorOrigin={{
                            vertical: 'top',
                            horizontal: 'center',
                        }}
                        transformOrigin={{
                            vertical: 'bottom',
                            horizontal: 'center',
                        }}
                    >
                        <MenuItem
                            onClick={() => {
                                setAnchorEl(null);
                                setCreatePrivateChatDialogOpen(true);
                            }}
                        >
                            Создать секретный чат
                        </MenuItem>
                        <MenuItem
                            onClick={() => {
                                setAnchorEl(null);
                                setCreateGroupDialogOpen(true);
                            }}
                        >
                            Создать группу
                        </MenuItem>
                    </Menu>
                </Box>
            )}
            <CreateGroupDialog
                open={createGroupDialogOpen}
                onClose={() => setCreateGroupDialogOpen(false)}
            />
            <CreatePrivateChatDialog
                open={createPrivateChatDialogOpen}
                onClose={() => setCreatePrivateChatDialogOpen(false)}
            />
        </>
    );
};
