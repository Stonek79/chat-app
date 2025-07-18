'use client';

import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from './useAuth';
import { API_FILES_AVATAR_ROUTE, ERROR_MESSAGES, UI_MESSAGES } from '@chat-app/core';
import type { AuthResponse } from '@chat-app/core';

export const useAvatar = () => {
    const { user, mutate } = useAuth();
    const [isUploading, setIsUploading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const uploadAvatar = useCallback(
        async (file: File) => {
            if (!user) return;

            const tempAvatarUrl = URL.createObjectURL(file);

            const uploadPromise = async (): Promise<AuthResponse> => {
                const formData = new FormData();
                formData.append('avatar', file);

                const response = await fetch(API_FILES_AVATAR_ROUTE, {
                    method: 'POST',
                    body: formData,
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || ERROR_MESSAGES.FILE_UPLOAD_ERROR);
                }

                return response.json();
            };

            try {
                setIsUploading(true);
                await mutate(uploadPromise, {
                    optimisticData: currentData => {
                        if (!currentData) return null;
                        return {
                            ...currentData,
                            user: { ...currentData.user, avatarUrl: tempAvatarUrl },
                        };
                    },
                    rollbackOnError: true,
                    revalidate: false,
                    populateCache: true,
                });
                toast.success(UI_MESSAGES.AVATAR_UPLOAD_SUCCESS);
            } catch (error) {
                const message =
                    error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR;
                toast.error(message);
            } finally {
                URL.revokeObjectURL(tempAvatarUrl);
                setIsUploading(false);
            }
        },
        [user, mutate]
    );

    const deleteAvatar = useCallback(async () => {
        if (!user || !user.avatarUrl) return;

        const originalAvatarUrl = user.avatarUrl;

        const deletePromise = async (): Promise<AuthResponse> => {
            const response = await fetch(API_FILES_AVATAR_ROUTE, {
                method: 'DELETE',
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || ERROR_MESSAGES.FILE_DELETE_ERROR);
            }
            return response.json();
        };

        try {
            setIsDeleting(true);
            await mutate(deletePromise, {
                optimisticData: currentData => {
                    if (!currentData) return null;
                    return { ...currentData, user: { ...currentData.user, avatarUrl: null } };
                },
                rollbackOnError: true,
                revalidate: false,
                populateCache: true,
            });
            toast.success(UI_MESSAGES.AVATAR_DELETE_SUCCESS);
        } catch (error) {
            const message = error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR;
            toast.error(message);
        } finally {
            setIsDeleting(false);
        }
    }, [user, mutate]);

    return {
        isUploading,
        isDeleting,
        uploadAvatar,
        deleteAvatar,
    };
};
