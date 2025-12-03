'use client';

import { useState, useEffect } from 'react';

/**
 * Hook to manage loading states for async operations
 * @param initialLoading - Initial loading state (default: false)
 * @returns Object with loading state and handlers
 */
export function useLoading(initialLoading = false) {
    const [isLoading, setIsLoading] = useState(initialLoading);

    const startLoading = () => setIsLoading(true);
    const stopLoading = () => setIsLoading(false);

    /**
     * Wraps an async function with loading state management
     * @param asyncFn - Async function to execute
     * @returns Promise that resolves with the result of asyncFn
     */
    const withLoading = async <T,>(asyncFn: () => Promise<T>): Promise<T> => {
        startLoading();
        try {
            const result = await asyncFn();
            return result;
        } finally {
            stopLoading();
        }
    };

    return {
        isLoading,
        startLoading,
        stopLoading,
        withLoading,
        setIsLoading,
    };
}

/**
 * Hook to show loading on initial page mount
 * @param delay - Minimum delay in ms before hiding loader (default: 500)
 */
export function usePageLoading(delay = 500) {
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, delay);

        return () => clearTimeout(timer);
    }, [delay]);

    return isLoading;
}
