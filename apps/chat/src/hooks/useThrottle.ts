import { useCallback, useRef } from 'react';

export function useThrottle<T extends (...args: any[]) => void>(func: T, limit: number): T {
    const inThrottle = useRef(false);
    
    return useCallback((...args: any[]) => {
        if (!inThrottle.current) {
            func(...args);
            inThrottle.current = true;
            setTimeout(() => {
                inThrottle.current = false;
            }, limit);
        }
    }, [func, limit]) as T;
}
