'use client';

import { RefObject, useEffect, useRef } from 'react';

interface UseLoadMoreOnScrollProps {
    hasMoreMessages: boolean;
    isLoadingMore: boolean;
    loadMoreMessages: () => Promise<void>;
    messagesContainerRef: RefObject<HTMLElement | null>;
    loaderRef: RefObject<HTMLElement | null>;
}

export const useLoadMoreOnScroll = ({
    hasMoreMessages,
    isLoadingMore,
    loadMoreMessages,
    messagesContainerRef,
    loaderRef,
}: UseLoadMoreOnScrollProps) => {
    const scrollStateBeforeLoad = useRef<{ scrollHeight: number; scrollTop: number } | null>(null);

    // Эффект для отслеживания скролла и запуска загрузки
    useEffect(() => {
        const loaderElem = loaderRef.current;
        const containerElem = messagesContainerRef.current;

        if (!loaderElem || !containerElem || !hasMoreMessages) {
            return;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry && entry.isIntersecting && !isLoadingMore) {
                    // 1. Сохраняем позицию скролла ПЕРЕД вызовом загрузки
                    scrollStateBeforeLoad.current = {
                        scrollHeight: containerElem.scrollHeight,
                        scrollTop: containerElem.scrollTop,
                    };
                    loadMoreMessages();
                }
            },
            {
                root: containerElem,
                threshold: 0.1, // <-- Снижаем порог до 10% видимости. Гораздо надежнее.
            }
        );

        observer.observe(loaderElem);
        return () => observer.disconnect();
    }, [hasMoreMessages, isLoadingMore, loadMoreMessages, loaderRef, messagesContainerRef]);

    // Эффект для восстановления позиции скролла ПОСЛЕ загрузки
    useEffect(() => {
        const container = messagesContainerRef.current;

        // Срабатывает, когда загрузка ЗАВЕРШИЛАСЬ (isLoadingMore стал false)
        // и у нас есть сохраненная позиция.
        if (container && !isLoadingMore && scrollStateBeforeLoad.current) {
            const { scrollHeight: oldScrollHeight } = scrollStateBeforeLoad.current;
            const scrollDifference = container.scrollHeight - oldScrollHeight;

            if (scrollDifference > 0) {
                container.scrollTop += scrollDifference;
            }

            // Сбрасываем состояние, чтобы не использовать его повторно
            scrollStateBeforeLoad.current = null;
        }
    }, [isLoadingMore, messagesContainerRef]); // <-- Правильная зависимость
};
