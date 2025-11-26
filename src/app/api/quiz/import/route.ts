import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import * as XLSX from 'xlsx';

export const dynamic = 'force-dynamic';

// POST: Import questions from Excel file
export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File;
        const quizId = formData.get('quizId') as string;

        if (!file || !quizId) {
            return NextResponse.json(
                { error: 'File and quizId are required' },
                { status: 400 }
            );
        }

        // Read the Excel file
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        if (!data || data.length === 0) {
            return NextResponse.json(
                { error: 'No data found in Excel file' },
                { status: 400 }
            );
        }

        // Expected format:
        // Question | Option1 | Option2 | Option3 | Option4 | CorrectAnswer | Explanation | Points
        const questions: any[] = [];

        for (const row of data as any[]) {
            const question = row['Question'] || row['question'];
            const option1 = row['Option1'] || row['option1'];
            const option2 = row['Option2'] || row['option2'];
            const option3 = row['Option3'] || row['option3'];
            const option4 = row['Option4'] || row['option4'];
            const correctAnswer = row['CorrectAnswer'] || row['correctAnswer'] || row['Correct Answer'];
            const explanation = row['Explanation'] || row['explanation'];
            const points = row['Points'] || row['points'] || 1;

            if (!question) continue;

            const options = [];
            const optionTexts = [option1, option2, option3, option4].filter(Boolean);

            for (let i = 0; i < optionTexts.length; i++) {
                const optionText = optionTexts[i];
                // Correct answer can be index (1,2,3,4) or text
                const isCorrect =
                    correctAnswer == i + 1 ||
                    correctAnswer?.toString().toLowerCase() === optionText?.toString().toLowerCase();

                options.push({
                    text: optionText,
                    isCorrect,
                    order: i
                });
            }

            questions.push({
                text: question,
                explanation,
                points: parseInt(points) || 1,
                questionType: 'SINGLE',
                options
            });
        }

        if (questions.length === 0) {
            return NextResponse.json(
                { error: 'No valid questions found in Excel file' },
                { status: 400 }
            );
        }

        // Create questions in database
        const createdQuestions = await prisma.$transaction(
            questions.map((q, index) =>
                prisma.quizQuestion.create({
                    data: {
                        quizId,
                        text: q.text,
                        explanation: q.explanation,
                        points: q.points,
                        order: index,
                        questionType: q.questionType,
                        options: {
                            create: q.options
                        }
                    },
                    include: {
                        options: true
                    }
                })
            )
        );

        return NextResponse.json({
            success: true,
            imported: createdQuestions.length,
            questions: createdQuestions
        }, { status: 201 });
    } catch (error) {
        console.error('Error importing questions:', error);
        return NextResponse.json(
            { error: 'Failed to import questions from Excel' },
            { status: 500 }
        );
    }
}
