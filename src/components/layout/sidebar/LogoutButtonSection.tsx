'use client';

import { useAuth } from '@/hooks';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import LogoutIcon from '@mui/icons-material/Logout';

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
