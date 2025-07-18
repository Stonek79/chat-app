'use client';

import Box from '@mui/material/Box';
import { UserProfileEditForm } from '@/components';
import { useAuth } from '@/hooks';
import { CircularProgress } from '@mui/material';

export default function ProfilePage() {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100%',
                }}
            >
                <CircularProgress />
            </Box>
        );
    }

    if (!user) {
        // This case should be handled by the layout which redirects unauthenticated users
        return null;
    }

    return <UserProfileEditForm />;
}
