'use client';

import LogoutIcon from '@mui/icons-material/Logout';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';

import { useAuth } from '@/hooks';

export function LogoutButtonSection() {
    const { logout, isLoading } = useAuth(); // Добавил isLoading для дизейбла кнопки при выходе

    return (
        <>
            <Divider />
            <Box sx={{ p: 2, mt: 'auto' }}>
                <Button
                    variant="outlined"
                    fullWidth
                    onClick={logout}
                    startIcon={<LogoutIcon />}
                    disabled={isLoading} // Дизейбл кнопки во время процесса выхода
                >
                    {isLoading ? 'Выход...' : 'Выйти'}
                </Button>
            </Box>
        </>
    );
}
