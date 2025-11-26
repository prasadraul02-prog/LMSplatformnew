import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// POST: Add questions to a quiz (single or bulk)
export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { quizId, questions } = body;

        if (!quizId || !questions || !Array.isArray(questions)) {
            return NextResponse.json(
                { error: 'Quiz ID and questions array are required' },
                { status: 400 }
            );
        }

        // Create questions with options in a transaction
        const createdQuestions = await prisma.$transaction(
            questions.map((q: any, index: number) =>
                prisma.quizQuestion.create({
                    data: {
                        quizId,
                        text: q.text,
                        imageUrl: q.imageUrl,
                        explanation: q.explanation,
                        points: q.points || 1,
                        order: q.order ?? index,
                        questionType: q.questionType || 'SINGLE',
                        options: {
                            create: q.options?.map((opt: any, optIndex: number) => ({
                                text: opt.text,
                                imageUrl: opt.imageUrl,
                                isCorrect: opt.isCorrect || false,
                                order: opt.order ?? optIndex
                            })) || []
                        }
                    },
                    include: {
                        options: true
                    }
                })
            )
        );

        return NextResponse.json(createdQuestions, { status: 201 });
    } catch (error) {
        console.error('Error creating questions:', error);
        return NextResponse.json(
            { error: 'Failed to create questions' },
            { status: 500 }
        );
    }
}

// PUT: Update a question
export async function PUT(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { questionId, text, imageUrl, explanation, points, questionType, options } = body;

        if (!questionId) {
            return NextResponse.json({ error: 'Question ID is required' }, { status: 400 });
        }

        // Update question and options in a transaction
        const updatedQuestion = await prisma.$transaction(async (tx) => {
            // Update the question
            const question = await tx.quizQuestion.update({
                where: { id: questionId },
                data: {
                    text,
                    imageUrl,
                    explanation,
                    points,
                    questionType
                }
            });

            // If options are provided, update them
            if (options && Array.isArray(options)) {
                // Delete existing options
                await tx.quizOption.deleteMany({
                    where: { questionId }
                });

                // Create new options
                await tx.quizOption.createMany({
                    data: options.map((opt: any, index: number) => ({
                        questionId,
                        text: opt.text,
                        imageUrl: opt.imageUrl,
                        isCorrect: opt.isCorrect || false,
                        order: opt.order ?? index
                    }))
                });
            }

            // Return updated question with options
            return await tx.quizQuestion.findUnique({
                where: { id: questionId },
                include: {
                    options: {
                        orderBy: { order: 'asc' }
                    }
                }
            });
        });

        return NextResponse.json(updatedQuestion);
    } catch (error) {
        console.error('Error updating question:', error);
        return NextResponse.json(
            { error: 'Failed to update question' },
            { status: 500 }
        );
    }
}

// DELETE: Delete a question
export async function DELETE(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const questionId = searchParams.get('id');

        if (!questionId) {
            return NextResponse.json({ error: 'Question ID is required' }, { status: 400 });
        }

        await prisma.quizQuestion.delete({
            where: { id: questionId }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting question:', error);
        return NextResponse.json(
            { error: 'Failed to delete question' },
            { status: 500 }
        );
    }
}
