import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// POST: Log web vitals
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, name, label, value } = body;

        // Log to console in development
        if (process.env.NODE_ENV === 'development') {
            console.log('[Web Vitals]', { name, value, label });
        }

        // In production, you would send this to your analytics service
        // Examples: Google Analytics, Vercel Analytics, custom DB

        // For now, just acknowledge receipt
        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error logging web vitals:', error);
        return NextResponse.json({ error: 'Failed to log vitals' }, { status: 500 });
    }
}
