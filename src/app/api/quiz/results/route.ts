import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET: Fetch quiz results
export async function GET(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const quizId = searchParams.get('quizId');
        const format = searchParams.get('format'); // 'json' or 'csv'

        if (!quizId) {
            return NextResponse.json({ error: 'Quiz ID is required' }, { status: 400 });
        }

        const attempts = await prisma.quizAttempt.findMany({
            where: { quizId },
            include: {
                link: {
                    select: {
                        name: true,
                        linkCode: true
                    }
                },
                answers: {
                    include: {
                        question: {
                            select: {
                                text: true,
                                points: true
                            }
                        },
                        option: {
                            select: {
                                text: true,
                                isCorrect: true
                            }
                        }
                    }
                }
            },
            orderBy: { submittedAt: 'desc' }
        });

        if (format === 'csv') {
            // Generate CSV
            const csvRows = [];

            // Get all unique questions from the attempts to create headers
            // We use a Map to keep order if possible, or just unique by ID/Text
            const questionMap = new Map<string, string>(); // id -> text

            attempts.forEach(attempt => {
                attempt.answers.forEach(ans => {
                    if (ans.questionId && ans.question?.text) {
                        questionMap.set(ans.questionId, ans.question.text);
                    }
                });
            });

            const questionIds = Array.from(questionMap.keys());

            // Header
            const headers = [
                'Submission Date',
                'Employee Name',
                'Employee Email',
                'Employee ID',
                'Link Name',
                'Link Code',
                'Score',
                'Total Points',
                'Percentage',
                'Passed',
                'Time Spent (seconds)',
                'IP Address'
            ];

            // Add question headers
            questionIds.forEach((qId, index) => {
                headers.push(`"Q${index + 1}: ${questionMap.get(qId)?.replace(/"/g, '""')}"`);
            });

            csvRows.push(headers.join(','));

            // Data rows
            for (const attempt of attempts) {
                const row = [
                    new Date(attempt.submittedAt).toLocaleString(),
                    `"${attempt.employeeName}"`,
                    attempt.employeeEmail,
                    attempt.employeeId || '',
                    `"${attempt.link?.name || 'Direct'}"`,
                    attempt.link?.linkCode || '',
                    attempt.score,
                    attempt.totalPoints,
                    attempt.percentage.toFixed(2),
                    attempt.passed ? 'Yes' : 'No',
                    attempt.timeSpent || '',
                    attempt.ipAddress || ''
                ];

                // Add answers for each question column
                questionIds.forEach(qId => {
                    const answer = attempt.answers.find(a => a.questionId === qId);
                    if (answer) {
                        const answerText = answer.option?.text || 'No Answer';
                        const isCorrect = answer.option?.isCorrect ? '(Correct)' : '(Wrong)';
                        row.push(`"${answerText.replace(/"/g, '""')} ${isCorrect}"`);
                    } else {
                        row.push('""');
                    }
                });

                csvRows.push(row.join(','));
            }

            const csv = csvRows.join('\n');

            return new NextResponse(csv, {
                headers: {
                    'Content-Type': 'text/csv',
                    'Content-Disposition': `attachment; filename="quiz-results-${quizId}.csv"`
                }
            });
        }

        // Return JSON by default
        return NextResponse.json(attempts);
    } catch (error) {
        console.error('Error fetching quiz results:', error);
        return NextResponse.json(
            { error: 'Failed to fetch quiz results' },
            { status: 500 }
        );
    }
}

// GET: Fetch detailed attempt
export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { attemptId } = body;

        if (!attemptId) {
            return NextResponse.json({ error: 'Attempt ID is required' }, { status: 400 });
        }

        const attempt = await prisma.quizAttempt.findUnique({
            where: { id: attemptId },
            include: {
                quiz: {
                    select: {
                        title: true
                    }
                },
                link: {
                    select: {
                        name: true,
                        linkCode: true
                    }
                },
                answers: {
                    include: {
                        question: {
                            include: {
                                options: true
                            }
                        },
                        option: true
                    },
                    orderBy: {
                        question: {
                            order: 'asc'
                        }
                    }
                }
            }
        });

        if (!attempt) {
            return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
        }

        return NextResponse.json(attempt);
    } catch (error) {
        console.error('Error fetching attempt details:', error);
        return NextResponse.json(
            { error: 'Failed to fetch attempt details' },
            { status: 500 }
        );
    }
}
