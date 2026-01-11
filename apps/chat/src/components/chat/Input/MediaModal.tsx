'use client';

import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    Grid,
} from '@mui/material';
import { AudioFile, Camera, Close, Description, Photo, VideoFile } from '@mui/icons-material';
import { useMobile } from '@/hooks';

const types = [
    { type: 'image', icon: <Photo />, label: 'Фото' },
    { type: 'video', icon: <VideoFile />, label: 'Видео' },
    { type: 'audio', icon: <AudioFile />, label: 'Аудио' },
    { type: 'camera', icon: <Camera />, label: 'Камера' },
    { type: 'file', icon: <Description />, label: 'Файлы' },
];

interface MediaModalProps {
    open: boolean;
    onClose: () => void;
    onFileSelect: (file: File) => void;
}

export const MediaModal = ({ open, onClose, onFileSelect }: MediaModalProps) => {
    const isMobile = useMobile();

    const handleOptionClick = (type: (typeof types)[number]['type']) => {
        const input = document.createElement('input');
        input.type = 'file';

        switch (type) {
            case 'image':
                input.accept = 'image/*';
                break;
            case 'video':
                input.accept = 'video/*';
                break;
            case 'audio':
                input.accept = 'audio/*';
                break;
            case 'document':
                input.accept = '.pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx';
                break;
            case 'camera':
                input.accept = 'image/*';
                input.capture = 'environment';
                break;
        }

        input.onchange = e => {
            const target = e.target as HTMLInputElement;
            const file = target.files?.[0];
            if (file) {
                onFileSelect(file);
                onClose();
            }
        };
        input.click();
    };

    if (isMobile) return null; // Только для десктопа

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                <Box
                    sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                    <Typography variant="h6">Выберите медиа файл</Typography>
                    <Button onClick={onClose}>
                        <Close />
                    </Button>
                </Box>
            </DialogTitle>

            <DialogContent>
                <Grid
                    container
                    justifyContent="center"
                    alignItems="center"
                    spacing={{ xs: 2, md: 3 }}
                    columns={{ xs: 4, sm: 8, md: 12 }}
                >
                    {types.map(type => (
                        <Grid key={type.type} size={{ xs: 2, sm: 4, md: 4 }}>
                            <Button
                                startIcon={type.icon}
                                onClick={() => handleOptionClick(type.type)}
                                fullWidth
                                variant="outlined"
                                sx={{
                                    textTransform: 'none',
                                    textWrap: 'nowrap',
                                    padding: 1,
                                    textAlign: 'center',
                                    borderRadius: 1,
                                    borderColor: 'divider',
                                    borderWidth: 1,
                                    borderStyle: 'solid',
                                }}
                            >
                                {type.label}
                            </Button>
                        </Grid>
                    ))}
                </Grid>
            </DialogContent>
        </Dialog>
    );
};
