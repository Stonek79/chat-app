import { useRef, useEffect, useCallback, useState } from 'react';
import type { SocketMessagePayload } from '@/types';

export interface UseMessageListScrollAndViewProps {
    messages: SocketMessagePayload[];
    onMessageView: (messageId: string) => void;
    loading: boolean; // chat details are loading
    currentUserId?: string;
    chatId?: string;
    initialMessagesLoaded: boolean; // first batch of messages for the current chat is loaded
}

/**
 * Хук для управления скроллом и отслеживанием видимости сообщений в списке
 */
export const useMessageListScrollAndView = (props: UseMessageListScrollAndViewProps) => {
    const {
        // ENSURE THIS DESTRUCTURING IS PRESENT AND CORRECT
        messages,
        onMessageView,
        loading,
        currentUserId,
        chatId,
        initialMessagesLoaded,
    } = props;

    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const intersectionObserverRef = useRef<IntersectionObserver | null>(null);
    const [initialScrollDone, setInitialScrollDone] = useState(false);
    const processedViewMessages = useRef<Set<string>>(new Set());

    const setMessageRef = useCallback((messageId: string, node: HTMLDivElement | null) => {
        if (node) {
            messageRefs.current[messageId] = node;
        } else {
            delete messageRefs.current[messageId];
        }
    }, []);

    const findFirstUnreadMessage = useCallback(() => {
        if (!currentUserId || !initialMessagesLoaded) return undefined;
        for (const message of messages) {
            if (
                message.sender.id !== currentUserId &&
                !message.readReceipts.some(r => r.userId === currentUserId)
            ) {
                return message;
            }
        }
        return undefined;
    }, [messages, currentUserId, initialMessagesLoaded]);

    // IntersectionObserver для отслеживания видимости сообщений
    useEffect(() => {
        if (typeof IntersectionObserver === 'undefined') {
            console.warn('Intersection Observer is not supported, fallback will be used.');
            return;
        }

        if (!onMessageView || !initialMessagesLoaded || !messagesContainerRef.current) {
            // Ensure necessary checks
            return;
        }
        if (intersectionObserverRef.current) {
            intersectionObserverRef.current.disconnect();
        }

        const observer = new IntersectionObserver(
            entries => {
                entries.forEach(entry => {
                    const messageId = entry.target.getAttribute('data-message-id');
                    if (
                        entry.isIntersecting &&
                        messageId &&
                        !processedViewMessages.current.has(messageId)
                    ) {
                        if (onMessageView) {
                            // Check onMessageView before calling
                            onMessageView(messageId);
                        }
                        // Не добавляем в processedViewMessages, если это сообщение от текущего юзера
                        // или если IntersectionObserver работает с threshold < 1.0 (частично видимые)
                        // В данном случае, onMessageView вызывается для всех видимых, маркировка чтения произойдет в useChat
                        // processedViewMessages.current.add(messageId);
                        // observer.unobserve(entry.target); // Перестать наблюдать после первой видимости
                    }
                });
            },
            {
                root: messagesContainerRef.current,
                threshold: 0.5, // Сообщение считается видимым, если 50% его видно
            }
        );
        intersectionObserverRef.current = observer;

        Object.entries(messageRefs.current).forEach(([id, ref]) => {
            if (ref) {
                observer.observe(ref);
            }
        });

        return () => {
            if (intersectionObserverRef.current) {
                intersectionObserverRef.current.disconnect();
            }
            processedViewMessages.current.clear();
        };
    }, [messages, onMessageView, currentUserId, initialMessagesLoaded, messagesContainerRef]); // messagesContainerRef added as per previous analysis

    // Скролл к первому непрочитанному или последнему сообщению
    useEffect(() => {
        if (loading || !initialMessagesLoaded || initialScrollDone || messages.length === 0) {
            // Corrected guard
            return;
        }

        const firstUnread = findFirstUnreadMessage();

        // Explicitly check typeof firstUnread.id to satisfy the linter
        if (firstUnread && typeof firstUnread.id === 'string') {
            const messageId = firstUnread.id; // Use a new const for the id
            if (messageRefs.current[messageId]) {
                // Check if the ref exists for this messageId
                messageRefs.current[messageId]?.scrollIntoView({
                    behavior: 'auto',
                    block: 'start',
                });
            }
        } else if (messages.length > 0 && messagesEndRef.current) {
            console.log('[useMessageListScrollAndView DEBUG] Scrolling to messages end.');
            messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
        }
        setInitialScrollDone(true);
    }, [
        loading,
        messages,
        findFirstUnreadMessage,
        initialScrollDone,
        currentUserId,
        initialMessagesLoaded,
    ]);

    // Начальная проверка видимых сообщений (для случая, если чат короткий и все сообщения видны сразу)
    useEffect(() => {
        if (
            loading ||
            !initialScrollDone || // Должен выполниться ПОСЛЕ начального скролла
            !messagesContainerRef.current || // RESTORED check
            !onMessageView || // RESTORED check
            !initialMessagesLoaded ||
            messages.length === 0
        ) {
            return;
        }

        Object.entries(messageRefs.current).forEach(([messageId, element]) => {
            if (element && messagesContainerRef.current) {
                const containerRect = messagesContainerRef.current.getBoundingClientRect();
                const elementRect = element.getBoundingClientRect();
                // Считаем видимым, если хотя бы часть сообщения находится в видимой области контейнера
                const isVisible =
                    elementRect.top < containerRect.bottom &&
                    elementRect.bottom > containerRect.top;

                if (isVisible && !processedViewMessages.current.has(messageId)) {
                    // const message = messages.find(m => m.id === messageId);
                    // if (message && message.sender.id !== currentUserId) { // Только для чужих сообщений

                    onMessageView(messageId); // onMessageView checked by guard
                    // processedViewMessages.current.add(messageId); // Не здесь, а в IntersectionObserver или пусть useChat решает
                    // }
                }
            }
        });
    }, [
        loading,
        initialScrollDone,
        messages,
        onMessageView,
        currentUserId,
        initialMessagesLoaded,
        messagesContainerRef,
    ]); // messagesContainerRef added as it's used

    // Этот эффект сбрасывает initialScrollDone при смене chatId или когда начинается загрузка нового чата.
    useEffect(() => {
        // Сбрасываем, чтобы логика начального скролла и начальной проверки видимости отработала для нового чата/при перезагрузке.
        setInitialScrollDone(false);
        processedViewMessages.current.clear(); // Также очищаем обработанные сообщения
    }, [chatId, loading]); // Используем chatId и loading из deconstructed props

    return { messagesContainerRef, messagesEndRef, setMessageRef };
};
