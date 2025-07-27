'use client';

import { useEffect, useRef } from 'react';

interface UseInitialScrollProps {
    chatId: string | null;
    initialMessagesLoaded: boolean;
    lastReadMessageId: string | null;
    messagesContainerRef: React.RefObject<HTMLElement | null>;
    getMessageRef: (id: string) => HTMLElement | undefined;
    messagesEndRef: React.RefObject<HTMLElement | null>;
}

export const useInitialScroll = ({
    chatId,
    initialMessagesLoaded,
    lastReadMessageId,
    messagesContainerRef,
    getMessageRef,
    messagesEndRef,
}: UseInitialScrollProps) => {
    const hasScrolledRef = useRef(false);

    // Сбрасываем флаг скролла при смене чата
    useEffect(() => {
        hasScrolledRef.current = false;
    }, [chatId]);

    useEffect(() => {
        if (!initialMessagesLoaded || hasScrolledRef.current || !messagesContainerRef.current) {
            return;
        }

        const scrollTo = (element: HTMLElement, behavior: ScrollBehavior = 'auto') => {
            element.scrollIntoView({ behavior, block: 'start' });
            hasScrolledRef.current = true;
        };

        const timer = setTimeout(() => {
            if (lastReadMessageId) {
                const unreadElement = getMessageRef(lastReadMessageId);
                if (unreadElement) {
                    console.log('[Scroll] Scrolling to first unread message:', lastReadMessageId);
                    scrollTo(unreadElement);
                    return;
                }
            }

            if (messagesEndRef.current) {
                console.log('[Scroll] No unread messages found, scrolling to bottom.');
                messagesEndRef.current.scrollIntoView({ behavior: 'auto', block: 'end' });
                hasScrolledRef.current = true;
            }
        }, 100); // Небольшая задержка, чтобы убедиться, что все элементы отрендерились

        return () => clearTimeout(timer);
    }, [
        initialMessagesLoaded,
        lastReadMessageId,
        chatId,
        messagesContainerRef,
        getMessageRef,
        messagesEndRef,
    ]);
};
