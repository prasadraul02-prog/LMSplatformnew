import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// POST: Log page views
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { url, referrer, timestamp } = body;

        // Log to console in development
        if (process.env.NODE_ENV === 'development') {
            console.log('[Page View]', { url, referrer, timestamp });
        }

        // In production, you could:
        // 1. Store in analytics database
        // 2. Send to Google Analytics
        // 3. Track user journey
        // 4. Build custom reports

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error logging page view:', error);
        return NextResponse.json({ error: 'Failed to log page view' }, { status: 500 });
    }
}
