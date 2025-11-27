import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Simple in-memory rate limiting (for basic protection)
const rateLimit = new Map<string, { count: number; resetTime: number }>();

export function middleware(request: NextRequest) {
    // Get client IP
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'anonymous';

    // Rate limiting for API routes
    if (request.nextUrl.pathname.startsWith('/api/')) {
        const now = Date.now();
        const windowMs = 60000; // 1 minute window
        const maxRequests = 100; // 100 requests per minute

        const key = `${ip}-${Math.floor(now / windowMs)}`;
        const current = rateLimit.get(key) || { count: 0, resetTime: now + windowMs };

        // Clean up old entries
        if (current.resetTime < now) {
            rateLimit.delete(key);
            current.count = 0;
            current.resetTime = now + windowMs;
        }

        current.count++;
        rateLimit.set(key, current);

        // Check if limit exceeded
        if (current.count > maxRequests) {
            return new NextResponse(
                JSON.stringify({
                    error: 'Too many requests. Please try again later.',
                    retryAfter: Math.ceil((current.resetTime - now) / 1000)
                }),
                {
                    status: 429,
                    headers: {
                        'Content-Type': 'application/json',
                        'Retry-After': String(Math.ceil((current.resetTime - now) / 1000)),
                        'X-RateLimit-Limit': String(maxRequests),
                        'X-RateLimit-Remaining': String(Math.max(0, maxRequests - current.count)),
                        'X-RateLimit-Reset': String(current.resetTime),
                    },
                }
            );
        }

        // Add rate limit headers to response
        const response = NextResponse.next();
        response.headers.set('X-RateLimit-Limit', String(maxRequests));
        response.headers.set('X-RateLimit-Remaining', String(Math.max(0, maxRequests - current.count)));
        response.headers.set('X-RateLimit-Reset', String(current.resetTime));
        return response;
    }

    return NextResponse.next();
}

// Configure which routes use middleware
export const config = {
    matcher: [
        '/api/:path*',
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
