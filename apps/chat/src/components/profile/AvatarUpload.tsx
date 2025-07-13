'use client';

import { ChangeEvent, useState } from 'react';
import Avatar from '@mui/material/Avatar';
import ButtonBase from '@mui/material/ButtonBase';
import { useAuth } from '@/hooks';
import { CircularProgress, Box } from '@mui/material';
import toast from 'react-hot-toast';
import { API_FILES_AVATAR_ROUTE, UI_MESSAGES } from '@chat-app/core';

export const AvatarUpload = () => {
    const { user, mutate } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    const usernameInitial = user?.username ? user.username.charAt(0).toUpperCase() : 'A';
    const avatarSrc = user?.avatarUrl || '';

    const handleAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !user) return;

        setIsLoading(true);
        const formData = new FormData();
        formData.append('avatar', file);

        try {
            const response = await fetch(API_FILES_AVATAR_ROUTE, {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || UI_MESSAGES.AVATAR_UPLOAD_FAILED);
            }

            // Manually trigger a re-fetch/re-validation of the user data
            await mutate();
        } catch (err) {
            const message = err instanceof Error ? err.message : UI_MESSAGES.UNKNOWN_ERROR;
            toast.error(`${UI_MESSAGES.AVATAR_UPLOAD_ERROR_TITLE}: ${message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Box sx={{ position: 'relative', width: 58, height: 58 }}>
            <ButtonBase
                component="label"
                role={undefined}
                tabIndex={-1}
                aria-label="Avatar image"
                sx={{
                    borderRadius: '50%',
                    '&:has(:focus-visible)': {
                        outline: '2px solid',
                        outlineOffset: '2px',
                    },
                }}
                disabled={isLoading}
            >
                <Avatar alt="User avatar" src={avatarSrc} sx={{ width: 58, height: 58 }}>
                    {usernameInitial}
                </Avatar>
                <input type="file" accept="image/*" hidden onChange={handleAvatarChange} />
            </ButtonBase>
            {isLoading && (
                <CircularProgress
                    size={58}
                    sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        zIndex: 1,
                    }}
                />
            )}
        </Box>
    );
};
