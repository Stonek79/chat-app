import { useEffect, useRef } from 'react';

interface UseMessageVisibilityProps {
    onVisible: (messageId: string) => void;
    root?: Element | null;
    threshold?: number;
}

/**
 * Хук для отслеживания видимости сообщений с использованием Intersection Observer.
 * @param onVisible - Колбэк, вызываемый с ID сообщения, когда оно становится видимым.
 * @param root - Корневой элемент для наблюдателя (viewport по умолчанию).
 * @param threshold - Порог видимости (от 0 до 1).
 * @returns - Функция `observe`, которую нужно вызывать для каждого элемента (сообщения),
 * за которым нужно следить.
 */
export const useMessageVisibility = ({
    onVisible,
    root = null,
}: UseMessageVisibilityProps) => {
    const observerRef = useRef<IntersectionObserver | null>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const messageId = (entry.target as HTMLElement).dataset.messageId;
                        if (messageId) {
                            onVisible(messageId);
                            // После того как мы зафиксировали прочтение,
                            // можно перестать следить за этим элементом, чтобы избежать повторных вызовов.
                            observer.unobserve(entry.target);
                        }
                    }
                });
            },
            {
                root,
                threshold: 1.0,
            }
        );

        observerRef.current = observer;

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, [onVisible, root]);

    const observe = (element: HTMLElement | null) => {
        if (element && observerRef.current) {
            observerRef.current.observe(element);
        }
    };

    return { observe };
};
