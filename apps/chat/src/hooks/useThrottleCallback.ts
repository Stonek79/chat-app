import { useCallback, useRef, useEffect } from 'react';

export function useThrottleCallback<T extends (...args: any[]) => void>(func: T, limit: number): [T, () => void] {
    const inThrottle = useRef(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const checkTimeout = useRef(func);

    useEffect(() => {
        checkTimeout.current = func;
    }, [func]);

    const throttledFunc = useCallback((...args: Parameters<T>) => {
        if (!inThrottle.current) {
            checkTimeout.current(...args);
            inThrottle.current = true;
            timeoutRef.current = setTimeout(() => {
                inThrottle.current = false;
            }, limit);
        }
    }, [limit]); // Removed func dependency as checkTimeout is used

    const cancel = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        inThrottle.current = false;
    }, []);

    // Cleanup on unmount
    useEffect(() => cancel, [cancel]);

    return [throttledFunc as T, cancel];
}
