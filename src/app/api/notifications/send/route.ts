import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// POST: Send notifications (Admin only)
export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { title, message, type, target, userId, role } = body;

        if (!message) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }

        let usersToNotify: { id: string }[] = [];

        if (target === 'ALL') {
            usersToNotify = await prisma.user.findMany({
                select: { id: true }
            });
        } else if (target === 'ROLE' && role) {
            usersToNotify = await prisma.user.findMany({
                where: { role: role },
                select: { id: true }
            });
        } else if (target === 'USER' && userId) {
            usersToNotify = [{ id: userId }];
        } else {
            return NextResponse.json({ error: 'Invalid target' }, { status: 400 });
        }

        // Create notifications in bulk
        // Note: Prisma createMany doesn't support relations easily in all DBs, 
        // but for simple models it works. However, Notification relates to User.
        // We'll use a transaction or createMany if supported.
        // Since we need to link to User, we create one by one or use createMany with userId.

        await prisma.notification.createMany({
            data: usersToNotify.map(user => ({
                userId: user.id,
                message: title ? `${title}: ${message}` : message,
                read: false,
                // type is not in schema yet, we'll just prepend it to message or ignore for now
                // Ideally schema should be updated, but for now we stick to existing schema
            }))
        });

        return NextResponse.json({
            success: true,
            count: usersToNotify.length
        });

    } catch (error) {
        console.error('Error sending notifications:', error);
        return NextResponse.json(
            { error: 'Failed to send notifications' },
            { status: 500 }
        );
    }
}
