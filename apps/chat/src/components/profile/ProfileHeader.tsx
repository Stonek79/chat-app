'use client';

import { useRouter } from 'next/navigation';
import { Box, IconButton, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

export const ProfileHeader = () => {
    const router = useRouter();

    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                p: 2,
                borderBottom: '1px solid',
                borderColor: 'divider',
                width: '100%',
                mb: 2,
            }}
        >
            <IconButton onClick={() => router.back()} sx={{ mr: 2 }}>
                <ArrowBackIcon />
            </IconButton>
            <Typography variant="h6" component="h1">
                Назад
            </Typography>
        </Box>
    );
};
