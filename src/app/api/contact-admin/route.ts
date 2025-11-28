import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { email, message } = await request.json();

        if (!email || !message) {
            return NextResponse.json(
                { error: 'Email and message are required' },
                { status: 400 }
            );
        }

        // Send email to admin
        console.log(`Contact Admin Request from: ${email}`);

        // Import dynamically to avoid circular dependencies if any, though not expected here
        const { sendContactEmail } = await import('@/lib/email');

        const success = await sendContactEmail(email, message);

        if (!success) {
            throw new Error('Failed to send email via transport');
        }

        return NextResponse.json({
            success: true,
            message: 'Your message has been sent to the administrator. They will contact you shortly.'
        });
    } catch (error) {
        console.error('Error sending contact admin message:', error);
        return NextResponse.json(
            { error: 'Failed to send message' },
            { status: 500 }
        );
    }
}
