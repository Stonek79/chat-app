'use client';

import NextLink from 'next/link';
import { PROFILE_PAGE_ROUTE } from '@chat-app/core';
import { AuthenticatedUser } from '@chat-app/core';
import SettingsIcon from '@mui/icons-material/Settings';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

interface UserProfilePanelProps {
    user: AuthenticatedUser | null; // Принимаем AuthenticatedUser или null
}

export function UserProfilePanel({ user }: UserProfilePanelProps) {
    if (!user) {
        // Это состояние не должно возникать, если Sidebar получает initialUser
        // и useAuth().user обновляется корректно.
        // Для надежности можно добавить скелетон или просто null.
        return null;
    }

    return (
        <Box
            sx={{
                p: 2,
                borderBottom: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
                <Avatar sx={{ mr: 1.5, width: 40, height: 40, flexShrink: 0 }}>
                    {/* Используем первую букву username как аватар */}
                    {user.username ? user.username.charAt(0).toUpperCase() : 'П'}
                </Avatar>
                <Box sx={{ overflow: 'hidden' }}>
                    <Typography
                        variant="subtitle1"
                        component="div"
                        noWrap
                        sx={{ fontWeight: 'medium' }}
                    >
                        {user.username || 'Пользователь'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" noWrap>
                        {user.email}
                    </Typography>
                </Box>
            </Box>
            <IconButton component={NextLink} href={PROFILE_PAGE_ROUTE} title="Настройки профиля">
                <SettingsIcon />
            </IconButton>
        </Box>
    );
}
