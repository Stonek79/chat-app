'use client';

import { memo, useCallback } from 'react';
import { ChatParticipantRole } from '@chat-app/db';
import { useMobile } from '@/hooks';
import { SystemMessage } from './SystemMessage';
import { MessageActionsMenu } from './MessageActionsMenu';
import { MessageContent } from './MessageContent';
import { MessageFooter } from './MessageFooter';
import { DesktopMessageUI } from './DesktopMessageUI';
import { MobileMessageUI } from './MobileMessageUI';
import type { DisplayMessage } from '@chat-app/core';
import type { MessageUIProps } from './types';

interface ChatMessageProps {
    isSameSender: boolean;
    isGroupChat: boolean;
    message: DisplayMessage;
    userRole: ChatParticipantRole;
    participantsCount: number;
    isCurrentUser: boolean;
    isNextMessageFromSameSender: boolean;
    onEditRequest: (message: DisplayMessage) => void;
    onDelete: (messageId: string) => void;
}

const ChatMessageComponent = (props: ChatMessageProps) => {
    const {
        message,
        userRole,
        participantsCount,
        isCurrentUser,
        isGroupChat,
        isSameSender,
        isNextMessageFromSameSender,
        onEditRequest,
        onDelete,
    } = props;

    const messageId = message.id;
    const isMobile = useMobile();

    if (message.contentType === 'SYSTEM') {
        return <SystemMessage message={message} />;
    }

    const handleEdit = useCallback(() => onEditRequest(message), [message]);
    const handleDelete = useCallback(() => onDelete(messageId), [messageId]);

    const canManageMessage =
        isCurrentUser ||
        userRole === ChatParticipantRole.ADMIN ||
        userRole === ChatParticipantRole.OWNER;

    const content = <MessageContent message={message} isCurrentUser={isCurrentUser} />;

    const footer = (
        <MessageFooter
            message={message}
            isCurrentUser={isCurrentUser}
            participantsCount={participantsCount}
            isGroupChat={isGroupChat}
            isMobile={isMobile}
        />
    );

    const actionsMenu = canManageMessage ? (
        <MessageActionsMenu
            isCurrentUserMessage={isCurrentUser}
            message={message}
            userRole={userRole}
            onEdit={handleEdit}
            onDelete={handleDelete}
        />
    ) : null;

    // Формируем пропсы для UI-компонентов
    const uiProps: MessageUIProps = {
        message,
        isCurrentUser,
        isGroupChat,
        isSameSender,
        isNextMessageFromSameSender,
        content,
        footer,
        actionsMenu,
    };

    if (isMobile) {
        return <MobileMessageUI {...uiProps} />;
    }

    return <DesktopMessageUI {...uiProps} />;
};

ChatMessageComponent.displayName = 'ChatMessage';

export const ChatMessage = memo(ChatMessageComponent);
