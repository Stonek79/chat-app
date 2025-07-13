'use client';

import { useEffect, useRef } from 'react';

interface UseInitialScrollProps {
    chatId: string | null;
    initialMessagesLoaded: boolean;
    firstUnreadId: string | null;
    messagesContainerRef: React.RefObject<HTMLElement | null>;
    getMessageRef: (id: string) => HTMLElement | undefined;
    messagesEndRef: React.RefObject<HTMLElement | null>;
}

export const useInitialScroll = ({
    chatId,
    initialMessagesLoaded,
    firstUnreadId,
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
            if (firstUnreadId) {
                const unreadElement = getMessageRef(firstUnreadId);
                if (unreadElement) {
                    console.log('[Scroll] Scrolling to first unread message:', firstUnreadId);
                    scrollTo(unreadElement);
                    return;
                }
            }

            if (messagesEndRef.current) {
                console.log('[Scroll] No unread messages found, scrolling to bottom.');
                scrollTo(messagesEndRef.current);
            }
        }, 100); // Небольшая задержка, чтобы убедиться, что все элементы отрендерились

        return () => clearTimeout(timer);
    }, [
        initialMessagesLoaded,
        firstUnreadId,
        chatId,
        messagesContainerRef,
        getMessageRef,
        messagesEndRef,
    ]);
};
