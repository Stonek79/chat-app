'use client';

import CheckIcon from '@mui/icons-material/Check';
import DoneAllIcon from '@mui/icons-material/DoneAll';

import type { DisplayMessage } from '@/types';

interface MessageStatusIconProps {
    message: Pick<DisplayMessage, 'readReceipts'>;
    currentUserId: string;
}

export const MessageStatusIcon = ({ message, currentUserId }: MessageStatusIconProps) => {
    // Проверяем, прочитал ли кто-то *другой*
    const readByOthers = message.readReceipts?.some(
        receipt => receipt.userId !== currentUserId && receipt.readAt
    );

    // Проверяем, прочитали ли все
    const readByAll =
        message.readReceipts &&
        message.readReceipts.length > 0 &&
        message.readReceipts.every(r => r.readAt);

    // Проверяем, прочитал ли хоть кто-то
    const readBySome =
        message.readReceipts &&
        message.readReceipts.length > 0 &&
        message.readReceipts.some(r => r.readAt);

    if (readByOthers) {
        return <DoneAllIcon fontSize="inherit" color="info" />;
    }
    if (readByAll) {
        return <DoneAllIcon fontSize="inherit" color="success" />;
    }
    if (readBySome) {
        return <DoneAllIcon fontSize="inherit" />;
    }

    return <CheckIcon fontSize="inherit" />;
};
