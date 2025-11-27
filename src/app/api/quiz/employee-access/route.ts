import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

function generateLinkCode(): string {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
}

export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const quizId = searchParams.get('quizId');

        if (!quizId) {
            return NextResponse.json({ error: 'Quiz ID is required' }, { status: 400 });
        }

        // Check if quiz exists and is active
        const quiz = await prisma.standaloneQuiz.findUnique({
            where: { id: quizId }
        });

        if (!quiz || !quiz.isActive) {
            return NextResponse.json({ error: 'Quiz is not active' }, { status: 404 });
        }

        // 1. Try to find an existing enabled link
        let link = await prisma.quizLink.findFirst({
            where: {
                quizId,
                isEnabled: true,
                OR: [
                    { expiresAt: null },
                    { expiresAt: { gt: new Date() } }
                ]
            },
            orderBy: { createdAt: 'desc' }
        });

        // 2. If no link exists, create a default one
        if (!link) {
            let linkCode = generateLinkCode();
            // Ensure uniqueness
            while (await prisma.quizLink.findUnique({ where: { linkCode } })) {
                linkCode = generateLinkCode();
            }

            link = await prisma.quizLink.create({
                data: {
                    quizId,
                    linkCode,
                    name: 'Default Employee Access',
                    isEnabled: true,
                    maxUses: null, // Unlimited
                    autoDisable: false
                }
            });
        }

        return NextResponse.json({ linkCode: link.linkCode });

    } catch (error) {
        console.error('Error getting employee access link:', error);
        return NextResponse.json({ error: 'Failed to get access link' }, { status: 500 });
    }
}
