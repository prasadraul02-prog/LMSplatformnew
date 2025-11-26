import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Generate a unique link code
function generateLinkCode(): string {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
}

// GET: Fetch links for a quiz
export async function GET(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const quizId = searchParams.get('quizId');

        if (!quizId) {
            return NextResponse.json({ error: 'Quiz ID is required' }, { status: 400 });
        }

        const links = await prisma.quizLink.findMany({
            where: { quizId },
            include: {
                _count: {
                    select: { attempts: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(links);
    } catch (error) {
        console.error('Error fetching quiz links:', error);
        return NextResponse.json(
            { error: 'Failed to fetch quiz links' },
            { status: 500 }
        );
    }
}

// POST: Create a new quiz link
export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { quizId, name, maxUses, expiresAt, autoDisable } = body;

        if (!quizId) {
            return NextResponse.json({ error: 'Quiz ID is required' }, { status: 400 });
        }

        // Generate unique link code
        let linkCode = generateLinkCode();
        let exists = await prisma.quizLink.findUnique({ where: { linkCode } });

        while (exists) {
            linkCode = generateLinkCode();
            exists = await prisma.quizLink.findUnique({ where: { linkCode } });
        }

        const link = await prisma.quizLink.create({
            data: {
                quizId,
                linkCode,
                name,
                maxUses,
                expiresAt: expiresAt ? new Date(expiresAt) : null,
                autoDisable: autoDisable || false,
                isEnabled: true
            }
        });

        return NextResponse.json(link, { status: 201 });
    } catch (error) {
        console.error('Error creating quiz link:', error);
        return NextResponse.json(
            { error: 'Failed to create quiz link' },
            { status: 500 }
        );
    }
}

// PUT: Update quiz link (enable/disable, etc.)
export async function PUT(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { linkId, isEnabled, name, maxUses, expiresAt } = body;

        if (!linkId) {
            return NextResponse.json({ error: 'Link ID is required' }, { status: 400 });
        }

        const updateData: any = {};
        if (isEnabled !== undefined) updateData.isEnabled = isEnabled;
        if (name !== undefined) updateData.name = name;
        if (maxUses !== undefined) updateData.maxUses = maxUses;
        if (expiresAt !== undefined) updateData.expiresAt = expiresAt ? new Date(expiresAt) : null;

        const link = await prisma.quizLink.update({
            where: { id: linkId },
            data: updateData
        });

        return NextResponse.json(link);
    } catch (error) {
        console.error('Error updating quiz link:', error);
        return NextResponse.json(
            { error: 'Failed to update quiz link' },
            { status: 500 }
        );
    }
}

// DELETE: Delete a quiz link
export async function DELETE(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const linkId = searchParams.get('id');

        if (!linkId) {
            return NextResponse.json({ error: 'Link ID is required' }, { status: 400 });
        }

        await prisma.quizLink.delete({
            where: { id: linkId }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting quiz link:', error);
        return NextResponse.json(
            { error: 'Failed to delete quiz link' },
            { status: 500 }
        );
    }
}
