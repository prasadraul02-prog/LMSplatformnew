import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET: Fetch all quizzes or a single quiz by ID
export async function GET(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const isAdmin = session.user.role === 'ADMIN';
        const { searchParams } = new URL(request.url);
        const quizId = searchParams.get('id');

        if (quizId) {
            // Fetch single quiz with all related data
            const quiz = await prisma.standaloneQuiz.findUnique({
                where: { id: quizId },
                include: {
                    questions: {
                        include: {
                            options: {
                                orderBy: { order: 'asc' }
                            }
                        },
                        orderBy: { order: 'asc' }
                    },
                    links: {
                        orderBy: { createdAt: 'desc' }
                    },
                    _count: {
                        select: {
                            attempts: true
                        }
                    }
                }
            });

            if (!quiz) {
                return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
            }

            // If not admin, ensure quiz is active
            if (!isAdmin && !quiz.isActive) {
                return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
            }

            // If not admin, hide sensitive data (like correct answers if we had them in options)
            // Currently options don't have isCorrect exposed in the client type usually, but let's be safe
            if (!isAdmin) {
                // We might want to sanitize options here if they contained isCorrect
                // But for taking the quiz, we use a different endpoint /api/quiz/take/[code] usually.
                // This endpoint is for the detail page.
            }

            return NextResponse.json(quiz);
        } else {
            // Fetch all quizzes with summary data
            const whereClause = isAdmin ? {} : { isActive: true };

            const quizzes = await prisma.standaloneQuiz.findMany({
                where: whereClause,
                include: {
                    _count: {
                        select: {
                            questions: true,
                            links: true,
                            attempts: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });

            return NextResponse.json(quizzes);
        }
    } catch (error) {
        console.error('Error fetching quizzes:', error);
        return NextResponse.json(
            { error: 'Failed to fetch quizzes' },
            { status: 500 }
        );
    }
}

// POST: Create a new quiz
export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const {
            title,
            description,
            instructions,
            timeLimit,
            passScore,
            shuffleQuestions,
            shuffleOptions,
            showResults,
            showAnswers,
            allowReview,
            maxAttempts
        } = body;

        const quiz = await prisma.standaloneQuiz.create({
            data: {
                title,
                description,
                instructions,
                timeLimit,
                passScore: passScore || 70,
                shuffleQuestions: shuffleQuestions || false,
                shuffleOptions: shuffleOptions || false,
                showResults: showResults !== false,
                showAnswers: showAnswers !== false,
                allowReview: allowReview !== false,
                maxAttempts,
                createdBy: session.user.email || 'admin',
                isActive: true
            }
        });

        return NextResponse.json(quiz, { status: 201 });
    } catch (error) {
        console.error('Error creating quiz:', error);
        return NextResponse.json(
            { error: 'Failed to create quiz' },
            { status: 500 }
        );
    }
}

// PUT: Update an existing quiz
export async function PUT(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { id, ...updateData } = body;

        if (!id) {
            return NextResponse.json({ error: 'Quiz ID is required' }, { status: 400 });
        }

        const quiz = await prisma.standaloneQuiz.update({
            where: { id },
            data: updateData
        });

        return NextResponse.json(quiz);
    } catch (error) {
        console.error('Error updating quiz:', error);
        return NextResponse.json(
            { error: 'Failed to update quiz' },
            { status: 500 }
        );
    }
}

// DELETE: Delete a quiz
export async function DELETE(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const quizId = searchParams.get('id');

        if (!quizId) {
            return NextResponse.json({ error: 'Quiz ID is required' }, { status: 400 });
        }

        await prisma.standaloneQuiz.delete({
            where: { id: quizId }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting quiz:', error);
        return NextResponse.json(
            { error: 'Failed to delete quiz' },
            { status: 500 }
        );
    }
}
