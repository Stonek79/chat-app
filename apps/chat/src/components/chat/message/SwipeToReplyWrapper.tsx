import { DisplayMessage } from '@chat-app/core';
import useChatStore from '@/store/chatStore';
import { motion, useAnimation, useMotionValue, useTransform } from 'framer-motion';
import { Box } from '@mui/material';
import { Reply } from '@mui/icons-material';
import { ReactNode } from 'react';
import { shallow } from 'zustand/vanilla/shallow';

interface SwipeToReplyWrapperProps {
    message: DisplayMessage;
    children: ReactNode;
}

export const SwipeToReplyWrapper = ({ message, children }: SwipeToReplyWrapperProps) => {
    const { setReplyToMessage } = useChatStore(
        state => ({
            setReplyToMessage: state.setReplyToMessage,
        }),
        shallow
    );

    const x = useMotionValue(0);
    const controls = useAnimation();

    const iconOpacity = useTransform(x, [0, 60], [0, 1]);
    const iconScale = useTransform(x, [0, 80], [0.5, 1.2]);

    const handleDragEnd = (
        event: MouseEvent | TouchEvent | PointerEvent,
        info: { offset: { x: number; y: number } }
    ) => {
        if (info.offset.x > 80) {
            setReplyToMessage(message);
        }
        controls.start({
            x: 0,
            transition: { type: 'spring', stiffness: 400, damping: 40 },
        });
    };

    return (
        <Box sx={{ position: 'relative' }}>
            <motion.div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'absolute',
                    left: 20,
                    top: '50%',
                    translateY: '-50%',
                    opacity: iconOpacity,
                    scale: iconScale,
                }}
            >
                <Reply sx={{ color: 'text.secondary' }} />
            </motion.div>
            <motion.div
                drag="x"
                dragConstraints={{ left: 0, right: 100 }}
                style={{ x, touchAction: 'pan-y' }}
                onDragEnd={handleDragEnd}
                animate={controls}
            >
                {children}
            </motion.div>
        </Box>
    );
};
