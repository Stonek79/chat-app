'use client';

import { Fab, Zoom } from '@mui/material';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { useCallback, useEffect, useState } from 'react';

interface ScrollToBottomButtonProps {
    messagesContainerRef: React.RefObject<HTMLElement | null>;
    messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

export const ScrollToBottomButton = ({
    messagesContainerRef,
    messagesEndRef,
}: ScrollToBottomButtonProps) => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const container = messagesContainerRef.current;
        if (!container) return;

        let timeoutId: NodeJS.Timeout;

        const handleScroll = () => {
            setVisible(true);
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                setVisible(false);
            }, 5000);
        };

        container.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            container.removeEventListener('scroll', handleScroll);
            clearTimeout(timeoutId);
        };
    }, [messagesContainerRef]);

    const handleClick = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messagesEndRef]);

    return (
        <Zoom in={visible}>
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
