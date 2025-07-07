'use client';

import { useCallback, useEffect, useRef } from 'react';
import type { DisplayMessage } from '@chat-app/core';

import { useDebounce } from './useDebounce';

interface UseMessageListScrollAndViewProps {
    messages: DisplayMessage[];
    currentUserId: string;
    loading: boolean;
    onMessageView: (messageId: string) => void;
    initialMessagesLoaded: boolean;
    chatId: string | null;
}

const DEBOUNCE_DELAY = 400; // Немного увеличим задержку для надежности

export const useMessageListScrollAndView = ({
    messages,
    currentUserId,
    loading,
    onMessageView,
    initialMessagesLoaded,
    chatId,
}: UseMessageListScrollAndViewProps) => {
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const observerRef = useRef<IntersectionObserver | null>(null);
    const messageRefs = useRef<Map<string, HTMLElement>>(new Map());

    // --- Новая, более надежная логика обработки видимости ---
    const isUserScrolling = useRef(false);
    const processedMessageIds = useRef(new Set<string>());
    const visibleMessagesQueue = useRef(new Set<string>());

    const processVisibleQueue = useCallback(() => {
        if (visibleMessagesQueue.current.size === 0) {
            return;
        }

        // Находим самый "поздний" (максимальный) ID в очереди
        const latestId = Array.from(visibleMessagesQueue.current).reduce((latest, current) =>
            current > latest ? current : latest
        );

        visibleMessagesQueue.current.clear();

        if (latestId) {
            onMessageView(latestId);
        }
    }, [onMessageView]);

    const debouncedProcessQueue = useDebounce(processVisibleQueue, DEBOUNCE_DELAY);

    // Эффект для инициализации IntersectionObserver
    useEffect(() => {
        const handleIntersection = (entries: IntersectionObserverEntry[]) => {
            let didAddToQueue = false;
            entries.forEach(entry => {
                const messageId = entry.target.getAttribute('data-message-id');
                if (
                    entry.isIntersecting &&
                    messageId &&
                    !isUserScrolling.current &&
                    !processedMessageIds.current.has(messageId)
                ) {
                    processedMessageIds.current.add(messageId);
                    visibleMessagesQueue.current.add(messageId);
                    didAddToQueue = true;
                }
            });

            if (didAddToQueue) {
                debouncedProcessQueue();
            }
        };

        const observer = new IntersectionObserver(handleIntersection, {
            root: messagesContainerRef.current,
            rootMargin: '0px 0px -50% 0px',
        });
        observerRef.current = observer;

        messageRefs.current.forEach(el => observer.observe(el));

        return () => {
            observer.disconnect();
            observerRef.current = null;
        };
    }, [debouncedProcessQueue]);
    // --- Конец новой логики ---

    // Эффект для отслеживания скролла пользователя
    useEffect(() => {
        let timer: NodeJS.Timeout;
        const handleScroll = () => {
            isUserScrolling.current = true;
            clearTimeout(timer);
            timer = setTimeout(() => {
                isUserScrolling.current = false;
            }, 200);
        };
        const container = messagesContainerRef.current;
        container?.addEventListener('scroll', handleScroll, { passive: true });
        return () => {
            container?.removeEventListener('scroll', handleScroll);
            clearTimeout(timer);
        };
    }, []);

    const hasScrolledToUnread = useRef(false);

    // Сброс флагов при смене чата
    useEffect(() => {
        hasScrolledToUnread.current = false;
        processedMessageIds.current.clear();
        visibleMessagesQueue.current.clear();
    }, [chatId]);

    // Эффект для авто-скролла
    useEffect(() => {
        if (!initialMessagesLoaded || loading) return;
        const container = messagesContainerRef.current;
        if (!container) return;

        if (!hasScrolledToUnread.current) {
            const firstUnreadMessage = messages.find(
                msg =>
                    msg.sender.id !== currentUserId &&
                    !msg.readReceipts?.some(r => r.userId === currentUserId)
            );
            if (firstUnreadMessage?.id) {
                const unreadElement = messageRefs.current.get(firstUnreadMessage.id);
                if (unreadElement) {
                    unreadElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    hasScrolledToUnread.current = true;
                    return;
                }
            }
        }

        const lastMessage = messages[messages.length - 1];
        if (!lastMessage) return;
        const isFromCurrentUser = lastMessage.sender.id === currentUserId;
        const isAtBottom =
            container.scrollHeight - container.scrollTop - container.clientHeight < 200;
        if (isFromCurrentUser || isAtBottom) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, initialMessagesLoaded, loading, currentUserId]);

    const setMessageRef = useCallback((messageId: string, node: HTMLElement | null) => {
        const observer = observerRef.current;
        const currentRef = messageRefs.current.get(messageId);

        if (currentRef && observer) {
            observer.unobserve(currentRef);
        }

        if (node) {
            messageRefs.current.set(messageId, node);
            if (observer) {
                observer.observe(node);
            }
        } else {
            messageRefs.current.delete(messageId);
        }
    }, []);

    return { messagesContainerRef, messagesEndRef, setMessageRef };
};
