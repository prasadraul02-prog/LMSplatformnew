import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// POST: Log errors
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { message, source, lineno, colno, error, reason, timestamp, userAgent, url } = body;

        // Log to console
        console.error('[Client Error]', {
            message,
            source,
            line: lineno,
            column: colno,
            stack: error,
            reason,
            timestamp,
            url,
        });

        // In production, you could:
        // 1. Store in database for analysis
        // 2. Send to error tracking service (Sentry, Rollbar)
        // 3. Alert team for critical errors
        // 4. Group similar errors

        // For now, acknowledge receipt
        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error logging client error:', error);
        return NextResponse.json({ error: 'Failed to log error' }, { status: 500 });
    }
}
