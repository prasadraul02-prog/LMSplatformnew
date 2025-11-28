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

        // TODO: Send email to admin
        // For now, we'll just log it and return success
        console.log(`Contact Admin Request from: ${email}`);
        console.log(`Message: ${message}`);

        // In production, you would send an actual email here using the EMAIL_SERVER env var
        // Example with nodemailer or similar service

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
