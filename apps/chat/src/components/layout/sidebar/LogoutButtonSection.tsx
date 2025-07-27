'use client';

import useSWR from 'swr';
import LogoutIcon from '@mui/icons-material/Logout';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { logout } from '@/lib/auth/actions';
import { API_AUTH_ME_ROUTE, LOGIN_PAGE_ROUTE } from '@chat-app/core';
import { toast } from 'react-hot-toast';

export function LogoutButtonSection() {
    const router = useRouter();
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const { mutate } = useSWR(API_AUTH_ME_ROUTE);

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            await logout(mutate);
            router.push(LOGIN_PAGE_ROUTE);
        } catch (error) {
            console.error('Logout failed:', error);
            toast.error('Не удалось выйти из аккаунта');
        } finally {
            setIsLoggingOut(false);
        }
    };
    
    return (
        <>
            <Divider />
            <Box sx={{ p: 2, mt: 'auto' }}>
            <Button
                    variant="outlined"
                    fullWidth
                    onClick={handleLogout}
                    startIcon={<LogoutIcon />}
                    disabled={isLoggingOut}
                >
                    {isLoggingOut ? 'Выход...' : 'Выйти'}
                </Button>
            </Box>
        </>
    );
}
