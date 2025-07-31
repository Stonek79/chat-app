import type { DisplayMessage } from '@chat-app/core';
import type { ReactElement } from 'react';

export interface MessageUIProps {
    message: DisplayMessage;
    isCurrentUser: boolean;
    isGroupChat: boolean;
    isSameSender: boolean;
    isNextMessageFromSameSender: boolean;
    content: ReactElement;
    footer: ReactElement;
    actionsMenu: ReactElement | null;
    isMobile: boolean;
}
