import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

// Web Vitals tracking
export function reportWebVitals(metric: any) {
    const { id, name, label, value } = metric;
    // Send to analytics endpoint
    if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', name, {
            event_category: label === 'web-vital' ? 'Web Vitals' : 'Next.js custom metric',
            value: Math.round(name === 'CLS' ? value * 1000 : value),
            event_label: id,
            non_interaction: true,
        });
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
        console.log({
            metric: name,
            value: value,
            label: label,
            id: id,
        });
    }

    // Send to your analytics service (optional)
    fetch('/api/analytics/vitals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name, label, value }),
    }).catch(console.error);
}

// Error boundary component
export function useErrorTracking() {
    useEffect(() => {
        const handleError = (event: ErrorEvent) => {
            // Log error to monitoring service
            fetch('/api/analytics/errors', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: event.message,
                    source: event.filename,
                    lineno: event.lineno,
                    colno: event.colno,
                    error: event.error?.stack,
                    timestamp: new Date().toISOString(),
                    userAgent: navigator.userAgent,
                    url: window.location.href,
                }),
            }).catch(console.error);

            console.error('Global error:', event.error);
        };

        const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
            // Log unhandled promise rejections
            fetch('/api/analytics/errors', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: 'Unhandled Promise Rejection',
                    reason: event.reason,
                    timestamp: new Date().toISOString(),
                    userAgent: navigator.userAgent,
                    url: window.location.href,
                }),
            }).catch(console.error);

            console.error('Unhandled promise rejection:', event.reason);
        };

        window.addEventListener('error', handleError);
        window.addEventListener('unhandledrejection', handleUnhandledRejection);

        return () => {
            window.removeEventListener('error', handleError);
            window.removeEventListener('unhandledrejection', handleUnhandledRejection);
        };
    }, []);
}

// Page view tracking
export function usePageTracking() {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        const url = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;

        // Track page views in GA
        if (typeof window !== 'undefined' && (window as any).gtag) {
            (window as any).gtag('config', process.env.NEXT_PUBLIC_GA_ID || '', {
                page_path: url,
            });
        }

        // Send to custom analytics API
        fetch('/api/analytics/pageview', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                url,
                referrer: typeof document !== 'undefined' ? document.referrer : '',
                timestamp: new Date().toISOString(),
            }),
        }).catch(console.error);

    }, [pathname, searchParams]);
}

// Performance monitoring hook
export function usePerformanceMonitoring() {
    useEffect(() => {
        if (typeof window === 'undefined') return;

        // Monitor long tasks
        if ('PerformanceObserver' in window) {
            try {
                const observer = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        if (entry.duration > 50) {
                            fetch('/api/analytics/performance', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    type: 'long-task',
                                    duration: entry.duration,
                                    startTime: entry.startTime,
                                    name: entry.name,
                                    timestamp: new Date().toISOString(),
                                }),
                            }).catch(console.error);
                        }
                    }
                });

                observer.observe({ entryTypes: ['longtask', 'largest-contentful-paint', 'first-input'] });

                return () => observer.disconnect();
            } catch (e) {
                console.error('Performance observer error:', e);
            }
        }
    }, []);
}
