'use client';

import type { DisplayMessage } from '@chat-app/core';
import CheckIcon from '@mui/icons-material/Check';
import DoneAllIcon from '@mui/icons-material/DoneAll';

interface MessageStatusIconProps {
    message: Pick<DisplayMessage, 'readReceipts' | 'sender'>;
    currentUserId: string;
    participantsCount: number;
}

export const MessageStatusIcon = ({
    message,
    currentUserId,
    participantsCount,
}: MessageStatusIconProps) => {
    // Этот компонент имеет смысл только для сообщений текущего пользователя
    if (message.sender.id !== currentUserId) {
        return null;
    }

    const readByCount = message.readReceipts?.length ?? 0;

    // Прочитано всеми (кроме самого себя)
    // В личном чате participantsCount = 2, readByCount должен быть 1
    // В групповом чате из 5 человек, readByCount должен быть 4
    const isReadByAll = readByCount >= participantsCount - 1;

    if (isReadByAll) {
        return <DoneAllIcon fontSize="inherit" color="primary" />;
    }

    // Прочитано хотя бы одним человеком
    if (readByCount > 0) {
        return <DoneAllIcon fontSize="inherit" sx={{ color: 'text.secondary' }} />;
    }

    // Просто отправлено
    return <CheckIcon fontSize="inherit" sx={{ color: 'text.secondary' }} />;
};
