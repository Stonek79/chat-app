'use client';

import { memo } from 'react';
import { ChatParticipantRole } from '@chat-app/db';
import { useMobile } from '@/hooks';
import { SystemMessage } from './SystemMessage';
import { MessageActionsMenu } from './parts/MessageActionsMenu';
import { MessageContent } from './parts/MessageContent';
import { MessageFooter } from './parts/MessageFooter';
import { DesktopMessageUI } from './DesktopMessageUI';
import { MobileMessageUI } from './MobileMessageUI';
import type { DisplayMessage } from '@chat-app/core';
import type { MessageUIProps } from './types';
import { SwipeToReplyWrapper } from './SwipeToReplyWrapper';

interface ChatMessageProps {
    isSameSender: boolean;
    isGroupChat: boolean;
    message: DisplayMessage;
    userRole: ChatParticipantRole;
    participantsCount: number;
    isCurrentUser: boolean;
    isNextMessageFromSameSender: boolean;
}

export const ChatMessage = memo((props: ChatMessageProps) => {
    const {
        message,
        userRole,
        participantsCount,
        isCurrentUser,
        isGroupChat,
        isSameSender,
        isNextMessageFromSameSender,
    } = props;

    const isMobile = useMobile();

    if (message.contentType === 'SYSTEM') {
        return <SystemMessage message={message} />;
    }

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
        isMobile,
    };

    if (isMobile) {
        return (
            <SwipeToReplyWrapper message={message}>
                <MobileMessageUI {...uiProps} />
            </SwipeToReplyWrapper>
        );
    }

    return <DesktopMessageUI {...uiProps} />;
});
