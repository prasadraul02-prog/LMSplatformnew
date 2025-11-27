import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// POST: Log performance metrics
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { type, duration, startTime, name, timestamp } = body;

        // Log to console in development
        if (process.env.NODE_ENV === 'development') {
            console.log('[Performance]', { type, duration, name });
        }

        // In production, you could:
        // 1. Track slow operations
        // 2. Identify bottlenecks
        // 3. Monitor performance trends
        // 4. Alert on performance degradation

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error logging performance:', error);
        return NextResponse.json({ error: 'Failed to log performance' }, { status: 500 });
    }
}
