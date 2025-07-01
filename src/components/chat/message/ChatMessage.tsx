'use client';

import { memo } from 'react';
import { Avatar, Box, Typography } from '@mui/material';

import { MessageActionTypeEnum } from '@/constants';
import type { DisplayMessage } from '@/types';

import { DeletedMessage } from './DeletedMessage';
import { MessageActionsMenu } from './MessageActionsMenu';
import { MessageBubble } from './MessageBubble';
import { MessageContent } from './MessageContent';
import { MessageFooter } from './MessageFooter';
import { SystemMessage } from './SystemMessage';
import { useMobile } from '@/hooks/useMobile';
import { getUserColor } from '@/utils';

const defaultAvatarName = (name: string) => {
    if (!name) {
        return { children: 'U' };
    }

    const firstName = name.split(' ')[0];
    const lastName = name.split(' ')[1];

    if (firstName && lastName) {
        return { children: `${firstName.charAt(0)}${lastName.charAt(0)}` };
    }

    if (name.charAt(0) === name.charAt(0).toUpperCase()) {
        const [firstChar, ...chars] = name;
        const secondChar =
            [...chars].find(char => char === char.toUpperCase()) || chars[0].toUpperCase();
        return { children: `${firstChar}${secondChar}` };
    }

    return { children: 'U' };
};

interface MessageItemProps {
    isSameSender: boolean;
    isGroupChat: boolean;
    message: DisplayMessage;
    currentUserId: string;
    isAdmin: boolean;
    onEdit: (message: DisplayMessage) => void;
    onDelete: (messageId: string) => void;
}

/**
 * Компонент для отображения отдельного сообщения в чате
 * Поддерживает различные типы контента и действия с сообщением
 */
const ChatMessageComponent = ({
    message,
    currentUserId,
    isAdmin,
    onEdit,
    onDelete,
    isSameSender,
    isGroupChat,
}: MessageItemProps) => {
    const { contentType } = message;
    const isMobile = useMobile();

    const isCurrentUser =
        message.isCurrentUser !== undefined
            ? message.isCurrentUser
            : message.sender && message.sender.id === currentUserId;

    // Проверяем, удалено ли сообщение
    const isDeleted =
        message.actions?.some(action => action.type === MessageActionTypeEnum.DELETED) ?? false;

    if (contentType === 'SYSTEM') {
        return <SystemMessage message={message} />;
    }

    const handleEdit = () => onEdit(message);
    const handleDelete = () => onDelete(message.id);

    const senderColor = isCurrentUser
        ? 'primary'
        : message.sender
          ? getUserColor(message.sender.id)
          : '#FFFFFF';

    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: isCurrentUser && isMobile ? 'flex-end' : 'flex-start',
                mb: isMobile ? 1 : 0,
                width: '100%',
            }}
        >
            {(!isMobile || isGroupChat) && (
                <Avatar
                    src={message.sender?.avatarUrl ?? undefined}
                    alt={message.sender?.username ?? 'U'}
                    sx={{
                        width: isMobile ? 30 : 40,
                        fontSize: isMobile ? '1em' : 'inherit',
                        height: isSameSender || isMobile ? 30 : 40,
                        mr: 1,
                        alignSelf: 'flex-start',
                        visibility:
                            isSameSender || (isMobile && isGroupChat && isCurrentUser)
                                ? 'hidden'
                                : 'visible',
                    }}
                    {...defaultAvatarName(message.sender?.username)}
                />
            )}

            <Box
                sx={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'flex-start',
                    flexDirection: isCurrentUser && isMobile ? 'row-reverse' : 'column',
                }}
            >
                {!isSameSender && ((isGroupChat && !isCurrentUser) || !isMobile) && (
                    <Box sx={{ width: '100%', alignSelf: 'flex-start' }}>
                        <Typography color={senderColor} sx={{ fontWeight: 'bold' }} variant="body2">
                            {message.sender?.username}
                        </Typography>
                    </Box>
                )}
                <MessageBubble
                    isCurrentUser={isCurrentUser}
                    isMobile={isMobile}
                    isGroupChat={isGroupChat}
                >
                    {isDeleted ? (
                        <DeletedMessage message={message} currentUserId={currentUserId} />
                    ) : (
                        <>
                            <MessageContent message={message} />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <MessageFooter
                                    message={message}
                                    currentUserId={currentUserId}
                                    isCurrentUser={isCurrentUser}
                                    isDeleted={isDeleted}
                                />
                                {(isCurrentUser || isAdmin) && (
                                    <MessageActionsMenu
                                        message={message}
                                        isAdmin={isAdmin}
                                        onEdit={handleEdit}
                                        onDelete={handleDelete}
                                    />
                                )}
                            </Box>
                        </>
                    )}
                </MessageBubble>
            </Box>
        </Box>
    );
};

export const ChatMessage = memo(ChatMessageComponent);
