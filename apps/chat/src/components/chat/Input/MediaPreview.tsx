'use client';

import { Box, Dialog, IconButton, Stack, Typography } from '@mui/material';
import { Close, Send } from '@mui/icons-material';
import { useEffect, useState } from 'react';
import type { Control } from 'react-hook-form';
import { InputField } from './InputField';
import { useMobile } from '@/hooks';

interface FormValues {
    message: string;
}

interface MediaPreviewProps {
    file: File | null;
    control: Control<FormValues>;
    onSend: () => void;
    onCancel: () => void;
}

/**
 * MediaPreview - компонент для превью выбранного медиафайла с полем подписи
 *
 * Функциональность:
 * - Отображает превью изображений и видео
 * - Показывает имя файла для документов
 * - Предоставляет поле для ввода подписи к медиа
 * - Кнопки "Отправить" и "Отмена"
 *
 */
export const MediaPreview = ({ file, control, onSend, onCancel }: MediaPreviewProps) => {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const isMobile = useMobile();

    useEffect(() => {
        if (file) {
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
            return () => URL.revokeObjectURL(url);
        } else {
            setPreviewUrl(null);
            return undefined;
        }
    }, [file]);

    const handleSubmit = () => {
        // Логика отправки будет в родительском компоненте
        onSend();
    };

    console.log('[file]', file);
    console.log('[previewUrl]', previewUrl);

    if (!file || !previewUrl) return null;

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    const isAudio = file.type.startsWith('audio/');

    const content = (
        <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1, mb: 1 }}>
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}
            >
                <Typography variant="subtitle2">{file.name}</Typography>
                <IconButton onClick={onCancel} size="small">
                    <Close fontSize="small" />
                </IconButton>
            </Box>

            <Box sx={{ mb: 2, justifySelf: 'center' }}>
                {isImage && (
                    <img
                        src={previewUrl}
                        alt="preview"
                        style={{
                            maxWidth: '100%',
                            maxHeight: '200px',
                            borderRadius: '8px',
                            objectFit: 'cover',
                        }}
                    />
                )}
                {isVideo && (
                    <video
                        src={previewUrl}
                        controls
                        style={{
                            maxWidth: '100%',
                            maxHeight: '200px',
                            borderRadius: '8px',
                        }}
                    />
                )}
                {isAudio && (
                    <audio
                        src={previewUrl}
                        controls
                        style={{
                            maxWidth: '100%',
                            borderRadius: '8px',
                        }}
                    />
                )}
                {/* Removed incorrect onRemove block */}
                {!isImage && !isVideo && !isAudio && (
                    <Box
                        sx={{
                            p: 2,
                            bgcolor: 'action.hover',
                            borderRadius: 1,
                            textAlign: 'center',
                        }}
                    >
                        <Typography variant="body2">{file.name}</Typography>
                    </Box>
                )}
            </Box>
            {!isMobile && <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                <InputField
                    control={control}
                    messageToEdit={null}
                    handleCancelEdit={() => {}}
                    handleSubmitMessage={handleSubmit}
                />
                <IconButton
                    color="primary"
                    type="submit"
                    aria-label="send message"
                    onClick={handleSubmit}
                >
                    <Send />
                </IconButton>
            </Stack>}
        </Box>
    );

    return isMobile ? (
        <Box>{content}</Box>
    ) : (
        <Dialog
            open={true}
            onClose={onCancel}
            maxWidth="sm"
            sx={{ width: '100%', minWidth: '200px' }}
            transitionDuration={200}
        >
            {content}
        </Dialog>
    );
};
