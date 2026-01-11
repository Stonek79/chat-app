import { useCallback, useRef, useEffect } from 'react';

export function useDebounceCallback<T extends (...args: any[]) => void>(func: T, delay: number): [T, () => void] {
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const callbackRef = useRef(func);

    useEffect(() => {
        callbackRef.current = func;
    }, [func]);

    const debouncedFunc = useCallback((...args: Parameters<T>) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
            callbackRef.current(...args);
        }, delay);
    }, [delay]);

    const cancel = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    }, []);

    // Cleanup on unmount
    useEffect(() => cancel, [cancel]);

    return [debouncedFunc as T, cancel];
}
