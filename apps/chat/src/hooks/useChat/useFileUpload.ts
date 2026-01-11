import { useState, useCallback } from 'react';
import { API_MEDIA_PRESIGNED_URL_ROUTE, PresignedUrlRequestPayload, PresignedUrlResponsePayload } from '@chat-app/core';

export const useFileUpload = (chatId?: string) => {
    const [fileToUpload, setFileToUpload] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [mediaDrawerOpen, setMediaDrawerOpen] = useState(false);
    const [selectedPreviewFile, setSelectedPreviewFile] = useState<File | null>(null);

    const handleFileSelect = useCallback((file: File) => {
        setSelectedPreviewFile(file);
        setMediaDrawerOpen(false);
        setFileToUpload(file);
    }, []);

    const handleCancelMedia = useCallback(() => {
        setSelectedPreviewFile(null);
        setFileToUpload(null);
    }, []);

    const uploadFile = async (file: File) => {
        if (!chatId) return null;
        setIsUploading(true);
        try {
            const payload: PresignedUrlRequestPayload = {
                fileName: file.name,
                fileType: file.type,
                chatId: chatId,
            };

            const res = await fetch(API_MEDIA_PRESIGNED_URL_ROUTE, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error('Failed to get upload URL');

            const { uploadUrl, publicUrl }: PresignedUrlResponsePayload = await res.json();

            const uploadRes = await fetch(uploadUrl, {
                method: 'PUT',
                body: file,
                headers: { 'Content-Type': file.type },
            });

            if (!uploadRes.ok) throw new Error('Failed to upload file');

            return publicUrl;
        } catch (error) {
            console.error(error);
            return null;
        } finally {
            setIsUploading(false);
        }
    };

    return {
        fileToUpload,
        isUploading,
        mediaDrawerOpen,
        setMediaDrawerOpen,
        selectedPreviewFile,
        setSelectedPreviewFile,
        setFileToUpload,
        handleFileSelect,
        handleCancelMedia,
        uploadFile,
    };
};
