'use client';

import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import { useMobile } from '@/hooks';
import {
    IconButton,
    List,
    ListItemIcon,
    ListItemText,
    Typography,
    ListItemButton,
} from '@mui/material';
import { Close, Photo, VideoFile, Camera, Description, AudioFile } from '@mui/icons-material';

interface MediaDrawerProps {
    open: boolean;
    onClose: () => void;
    onFileSelect: (file: File) => void;
}

export const MediaDrawer = ({ open, onClose, onFileSelect }: MediaDrawerProps) => {
    const isMobile = useMobile();

    const handleOptionClick = (type: 'image' | 'video' | 'document' | 'camera' | 'audio') => {
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

    if (!isMobile) {
        return null;
    }

    return (
        <Drawer
            anchor="bottom"
            open={open}
            onClose={onClose}
            keepMounted
            sx={{
                height: '50%',
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
            }}
        >
            <Box sx={{ p: 2 }}>
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: 2,
                    }}
                >
                    <Typography variant="h6">Выберите медиа</Typography>
                    <IconButton onClick={onClose}>
                        <Close />
                    </IconButton>
                </Box>

                <List>
                    <ListItemButton onClick={() => handleOptionClick('image')}>
                        <ListItemIcon>
                            <Photo />
                        </ListItemIcon>
                        <ListItemText primary="Фото из галереи" />
                    </ListItemButton>

                    <ListItemButton onClick={() => handleOptionClick('video')}>
                        <ListItemIcon>
                            <VideoFile />
                        </ListItemIcon>
                        <ListItemText primary="Видео из галереи" />
                    </ListItemButton>

                    <ListItemButton onClick={() => handleOptionClick('audio')}>
                        <ListItemIcon>
                            <AudioFile />
                        </ListItemIcon>
                        <ListItemText primary="Аудио из галереи" />
                    </ListItemButton>

                    <ListItemButton onClick={() => handleOptionClick('camera')}>
                        <ListItemIcon>
                            <Camera />
                        </ListItemIcon>
                        <ListItemText primary="Сделать фото" />
                    </ListItemButton>

                    <ListItemButton onClick={() => handleOptionClick('document')}>
                        <ListItemIcon>
                            <Description />
                        </ListItemIcon>
                        <ListItemText primary="Документ" />
                    </ListItemButton>
                </List>
            </Box>
        </Drawer>
    );
};
