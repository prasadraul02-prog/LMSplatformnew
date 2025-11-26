import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET: Validate and fetch quiz by link code
export async function GET(
    request: NextRequest,
    { params }: { params: { code: string } }
) {
    try {
        const code = params.code;

        if (!code) {
            return NextResponse.json({ error: 'Invalid link code' }, { status: 400 });
        }

        const link = await prisma.quizLink.findUnique({
            where: { linkCode: code },
            include: {
                quiz: {
                    include: {
                        questions: {
                            include: {
                                options: {
                                    orderBy: { order: 'asc' }
                                }
                            },
                            orderBy: { order: 'asc' }
                        }
                    }
                },
                _count: {
                    select: { attempts: true }
                }
            }
        });

        if (!link) {
            return NextResponse.json({ error: 'Quiz link not found' }, { status: 404 });
        }

        // Validate link status
        if (!link.isEnabled) {
            return NextResponse.json({ error: 'This quiz link has been disabled' }, { status: 403 });
        }

        // Check expiration
        if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
            return NextResponse.json({ error: 'This quiz link has expired' }, { status: 403 });
        }

        // Check max uses
        if (link.maxUses && link.currentUses >= link.maxUses) {
            return NextResponse.json({ error: 'This quiz link has reached its maximum uses' }, { status: 403 });
        }

        // Remove correct answers from options for security
        const sanitizedQuiz = {
            ...link.quiz,
            questions: link.quiz.questions.map(q => ({
                ...q,
                options: q.options.map(({ isCorrect, ...opt }) => opt)
            }))
        };

        return NextResponse.json({
            link: {
                id: link.id,
                linkCode: link.linkCode,
                name: link.name
            },
            quiz: sanitizedQuiz
        });
    } catch (error) {
        console.error('Error validating quiz link:', error);
        return NextResponse.json(
            { error: 'Failed to validate quiz link' },
            { status: 500 }
        );
    }
}
