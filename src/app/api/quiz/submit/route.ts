import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// POST: Submit quiz attempt
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            linkCode,
            employeeName,
            employeeEmail,
            employeeId,
            answers,
            timeSpent,
            startedAt
        } = body;

        if (!linkCode || !employeeName || !employeeEmail || !answers) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Fetch link with quiz data
        const link = await prisma.quizLink.findUnique({
            where: { linkCode },
            include: {
                quiz: {
                    include: {
                        questions: {
                            include: {
                                options: true
                            }
                        }
                    }
                }
            }
        });

        if (!link || !link.isEnabled) {
            return NextResponse.json({ error: 'Invalid or disabled quiz link' }, { status: 403 });
        }

        // Check quiz max attempts per user
        if (link.quiz.maxAttempts) {
            const previousAttempts = await prisma.quizAttempt.count({
                where: {
                    quizId: link.quizId,
                    employeeEmail
                }
            });

            if (previousAttempts >= link.quiz.maxAttempts) {
                return NextResponse.json(
                    { error: 'Maximum attempts reached for this quiz' },
                    { status: 403 }
                );
            }
        }

        // Calculate score
        let score = 0;
        let totalPoints = 0;
        const processedAnswers: any[] = [];

        for (const answer of answers) {
            const question = link.quiz.questions.find(q => q.id === answer.questionId);
            if (!question) continue;

            totalPoints += question.points;

            const selectedOption = question.options.find(opt => opt.id === answer.optionId);
            const isCorrect = selectedOption?.isCorrect || false;

            if (isCorrect) {
                score += question.points;
            }

            processedAnswers.push({
                questionId: answer.questionId,
                optionId: answer.optionId,
                isCorrect,
                timeSpent: answer.timeSpent
            });
        }

        const percentage = totalPoints > 0 ? (score / totalPoints) * 100 : 0;
        const passed = percentage >= link.quiz.passScore;

        // Get client info
        const ipAddress = request.headers.get('x-forwarded-for') ||
            request.headers.get('x-real-ip') ||
            'unknown';
        const userAgent = request.headers.get('user-agent') || 'unknown';

        // Create attempt with answers in a transaction
        const attempt = await prisma.$transaction(async (tx) => {
            const newAttempt = await tx.quizAttempt.create({
                data: {
                    quizId: link.quizId,
                    linkId: link.id,
                    employeeName,
                    employeeEmail,
                    employeeId,
                    score,
                    totalPoints,
                    percentage,
                    passed,
                    timeSpent,
                    startedAt: startedAt ? new Date(startedAt) : new Date(),
                    ipAddress,
                    userAgent,
                    answers: {
                        create: processedAnswers
                    }
                },
                include: {
                    answers: {
                        include: {
                            question: true,
                            option: true
                        }
                    }
                }
            });

            // Increment link usage
            await tx.quizLink.update({
                where: { id: link.id },
                data: {
                    currentUses: { increment: 1 }
                }
            });

            // Auto-disable if needed
            if (link.autoDisable && link.maxUses && link.currentUses + 1 >= link.maxUses) {
                await tx.quizLink.update({
                    where: { id: link.id },
                    data: { isEnabled: false }
                });
            }

            return newAttempt;
        });

        // Prepare response based on quiz settings
        const response: any = {
            attemptId: attempt.id,
            score,
            totalPoints,
            percentage: parseFloat(percentage.toFixed(2)),
            passed
        };

        if (link.quiz.showAnswers) {
            response.answers = attempt.answers.map(ans => ({
                questionId: ans.questionId,
                questionText: ans.question.text,
                selectedOption: ans.option?.text,
                isCorrect: ans.isCorrect,
                correctOption: ans.question.options?.find((opt: any) => opt.isCorrect)?.text
            }));
        }

        return NextResponse.json(response, { status: 201 });
    } catch (error) {
        console.error('Error submitting quiz:', error);
        return NextResponse.json(
            { error: 'Failed to submit quiz' },
            { status: 500 }
        );
    }
}
