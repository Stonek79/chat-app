'use client';

import { useEffect, useRef } from 'react';

interface UseLoadMoreOnScrollProps {
    hasMoreMessages: boolean;
    isLoadingMore: boolean;
    loadMoreMessages: () => Promise<void>;
    messagesContainerRef: React.RefObject<HTMLElement | null>;
}

export const useLoadMoreOnScroll = ({
    hasMoreMessages,
    isLoadingMore,
    loadMoreMessages,
    messagesContainerRef,
}: UseLoadMoreOnScrollProps) => {
    const loaderRef = useRef<HTMLDivElement>(null);
    const scrollStateBeforeLoad = useRef<{ scrollHeight: number; scrollTop: number } | null>(null);

    // Эффект для отслеживания скролла вверх и загрузки старых сообщений
    useEffect(() => {
        const loader = loaderRef.current;
        if (!loader) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry && entry.isIntersecting && hasMoreMessages && !isLoadingMore) {
                    if (messagesContainerRef.current) {
                        scrollStateBeforeLoad.current = {
                            scrollHeight: messagesContainerRef.current.scrollHeight,
                            scrollTop: messagesContainerRef.current.scrollTop,
                        };
                    }
                    loadMoreMessages().catch(err =>
                        console.error('Failed to load more messages on scroll', err)
                    );
                }
            },
            {
                root: messagesContainerRef.current,
                threshold: 1.0,
            }
        );

        observer.observe(loader);

        return () => {
            observer.disconnect();
        };
    }, [hasMoreMessages, isLoadingMore, loadMoreMessages, messagesContainerRef]);

    // Эффект для сохранения позиции скролла после загрузки старых сообщений
    useEffect(() => {
        const container = messagesContainerRef.current;
        if (container && scrollStateBeforeLoad.current) {
            const { scrollHeight: oldScrollHeight, scrollTop: oldScrollTop } =
                scrollStateBeforeLoad.current;
            const newScrollHeight = container.scrollHeight;
            const scrollDifference = newScrollHeight - oldScrollHeight;

            if (scrollDifference > 0) {
                container.scrollTop = oldScrollTop + scrollDifference;
            }

            scrollStateBeforeLoad.current = null;
        }
    }, [messagesContainerRef.current?.scrollHeight]); // Зависим от высоты контейнера

    return loaderRef;
};
