'use client';

import { Fab, Zoom } from '@mui/material';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { useCallback, useEffect, useState, RefObject, useRef } from 'react';

interface ScrollToBottomButtonProps {
    messagesContainerRef: RefObject<HTMLElement | null>;
    messagesEndRef: RefObject<HTMLDivElement | null>;
}

// Порог в пикселях. Если до конца чата осталось меньше, считаем, что мы "внизу".
const SCROLL_THRESHOLD = 200;

export const ScrollToBottomButton = ({
    messagesContainerRef,
    messagesEndRef,
}: ScrollToBottomButtonProps) => {
    const [isVisible, setIsVisible] = useState(false);
    // Используем ref, чтобы хранить последнюю позицию скролла без лишних ререндеров.
    const lastScrollTop = useRef(0);

    const handleScroll = useCallback(() => {
        const container = messagesContainerRef.current;
        if (!container) return;

        const currentScrollTop = container.scrollTop;
        const isScrollingDown = currentScrollTop > lastScrollTop.current;
        const isScrollingUp = currentScrollTop < lastScrollTop.current;

        const scrollPosition = currentScrollTop + container.clientHeight;
        const isAtBottom = container.scrollHeight - scrollPosition <= SCROLL_THRESHOLD;

        // Правило 1: Если мы в самом низу, кнопка всегда скрыта.
        if (isAtBottom) {
            setIsVisible(false);
        }
        // Правило 2: Если скроллим ВНИЗ (но не внизу), показываем кнопку.
        else if (isScrollingDown) {
            setIsVisible(true);
        }
        // Правило 3: Если скроллим ВВЕРХ, скрываем кнопку.
        else if (isScrollingUp) {
            setIsVisible(false);
        }

        // Сохраняем текущую позицию для следующего события скролла.
        lastScrollTop.current = currentScrollTop <= 0 ? 0 : currentScrollTop;
    }, [messagesContainerRef]);

    useEffect(() => {
        const container = messagesContainerRef.current;
        if (!container) return;

        // Устанавливаем начальную позицию и гарантируем, что кнопка скрыта при монтировании.
        lastScrollTop.current = container.scrollTop;
        setIsVisible(false);

        container.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            container.removeEventListener('scroll', handleScroll);
        };
    }, [messagesContainerRef, handleScroll]);

    const handleClick = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messagesEndRef]);

    return (
        <Zoom in={isVisible}>
            <Fab
                color="secondary"
                size="small"
                onClick={handleClick}
                sx={{
                    position: 'absolute',
                    bottom: 88, // Отступ от поля ввода
                    right: 24,
                    zIndex: 10,
                }}
            >
                <ArrowDownwardIcon />
            </Fab>
        </Zoom>
    );
};
