import { useEffect, useRef } from 'react';

export const useChatScroll = (args: {
    messagesLength: number;
    replyToMessageIdentifier?: string | null;
    messageToEditIdentifier?: string | null;
}) => {
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = messagesContainerRef.current;
        if (container) {
            const isScrolledToBottom =
                container.scrollHeight - container.scrollTop <= container.clientHeight + 150;

            if (isScrolledToBottom) {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }
        }
    }, [args.replyToMessageIdentifier, args.messageToEditIdentifier, args.messagesLength]);

    return {
        messagesContainerRef,
        messagesEndRef,
    };
};
