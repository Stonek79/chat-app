'use client';

import { memo, forwardRef } from 'react';
import type { DisplayMessage } from '@chat-app/core';
import { ActionType } from '@chat-app/db';
import { Avatar, Box, Typography } from '@mui/material';
import { getUsernameColor } from '@/utils/colorUtils';
import { DeletedMessage } from './DeletedMessage';
import { MessageActionsMenu } from './MessageActionsMenu';
import { MessageContent } from './MessageContent';
import { MessageFooter } from './MessageFooter';
import { SystemMessage } from './SystemMessage';

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
            [...chars].find(char => char === char.toUpperCase()) ||
            (chars[0] ? chars[0].toUpperCase() : '');
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
    participantsCount: number;
    isCurrentUser: boolean;
    isMobile: boolean;
    isNextMessageFromSameSender: boolean;
}

/**
 * Компонент для отображения отдельного сообщения в чате
 * Поддерживает различные типы контента и действия с сообщением
 */
const ChatMessageComponent = forwardRef<HTMLDivElement, MessageItemProps>(
    (
        {
            message,
            currentUserId,
            isAdmin,
            onEdit,
            onDelete,
            isSameSender,
            isGroupChat,
            participantsCount,
            isCurrentUser,
            isMobile,
            isNextMessageFromSameSender,
        },
        ref
    ) => {
        const { contentType } = message;

        // Проверяем, удалено ли сообщение
        const isDeleted =
            message.actions?.some(action => action.type === ActionType.DELETED) ?? false;

        const showAvatar = isGroupChat && !isCurrentUser;
        const showSenderName = isGroupChat && !isCurrentUser && !isSameSender;
        const marginBottom = isNextMessageFromSameSender ? 0.25 : 1;

        if (contentType === 'SYSTEM') {
            return <SystemMessage message={message} />;
        }

        const handleEdit = () => onEdit(message);
        const handleDelete = () => onDelete(message.id);

        const senderColor = isCurrentUser
            ? 'primary'
            : message.sender
              ? getUsernameColor(message.sender.id)
              : '#FFFFFF';

        const containerSx = {
            display: 'flex',
            justifyContent: isCurrentUser ? 'flex-end' : 'flex-start',
            mb: marginBottom,
            px: 1,
            width: '100%',
            alignItems: 'flex-end',
        };

        return (
            <Box ref={ref} sx={containerSx}>
                {showAvatar && (
                    <Avatar
                        src={message.sender?.avatarUrl ?? undefined}
                        alt={message.sender?.username ?? 'U'}
                        sx={{
                            width: 30,
                            height: 30,
                            fontSize: '0.8em',
                            mr: 1,
                            visibility: isSameSender ? 'hidden' : 'visible',
                        }}
                        {...defaultAvatarName(message.sender?.username)}
                    />
                )}
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isCurrentUser ? 'flex-end' : 'flex-start',
                        maxWidth: '80%',
                    }}
                >
                    {showSenderName && (
                        <Typography
                            sx={{
                                fontWeight: 'bold',
                                color: getUsernameColor(message.sender.id),
                                ml: isCurrentUser ? 0 : 1.5,
                                mb: 0.5,
                            }}
                            variant="caption"
                        >
                            {message.sender.username}
                        </Typography>
                    )}
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {(isCurrentUser || isAdmin) && isCurrentUser && (
                            <MessageActionsMenu
                                message={message}
                                isAdmin={isAdmin}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                            />
                        )}
                        {isDeleted ? (
                            <DeletedMessage message={message} currentUserId={currentUserId} />
                        ) : (
                            <MessageContent message={message} isCurrentUser={isCurrentUser} />
                        )}
                        {(isCurrentUser || isAdmin) && !isCurrentUser && (
                            <MessageActionsMenu
                                message={message}
                                isAdmin={isAdmin}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                            />
                        )}
                    </Box>

                    {!isDeleted && (
                        <MessageFooter
                            message={message}
                            currentUserId={currentUserId}
                            isCurrentUser={isCurrentUser}
                            isDeleted={isDeleted}
                            participantsCount={participantsCount}
                        />
                    )}
                </Box>
            </Box>
        );
    }
);

ChatMessageComponent.displayName = 'ChatMessage';

export const ChatMessage = memo(ChatMessageComponent);
