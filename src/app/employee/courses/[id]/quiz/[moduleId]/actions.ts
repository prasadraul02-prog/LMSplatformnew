'use server';

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function submitQuiz(courseId: string, moduleId: string, answers: Record<string, string>) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    try {
        const quiz = await prisma.quiz.findUnique({
            where: { moduleId },
            include: { questions: true },
        });

        if (!quiz) return { error: "Quiz not found" };

        let score = 0;
        const totalQuestions = quiz.questions.length;

        quiz.questions.forEach(q => {
            const userAnswer = answers[q.id];
            if (!userAnswer) return;

            const options = q.options as any[]; // Array of { text, isCorrect }
            const correctOption = options.find(o => o.isCorrect);

            // Check if user answer matches correct option text
            if (correctOption && userAnswer === correctOption.text) {
                score++;
            }
        });

        const percentage = Math.round((score / totalQuestions) * 100);
        const passed = percentage >= quiz.passScore;

        // Save result
        await prisma.quizResult.create({
            data: {
                quizId: quiz.id,
                userId: session.user.id,
                score: percentage,
                passed,
            },
        });

        // If passed, mark module as complete
        if (passed) {
            const enrollment = await prisma.enrollment.findUnique({
                where: {
                    userId_courseId: {
                        userId: session.user.id,
                        courseId: courseId,
                    },
                },
            });

            if (enrollment) {
                await prisma.moduleProgress.upsert({
                    where: {
                        enrollmentId_moduleId: {
                            enrollmentId: enrollment.id,
                            moduleId: moduleId,
                        },
                    },
                    update: { completed: true },
                    create: {
                        enrollmentId: enrollment.id,
                        moduleId: moduleId,
                        completed: true,
                    },
                });

                // Recalculate course progress (simplified, ideally shared logic)
                // ...
            }
        }

        revalidatePath(`/employee/courses/${courseId}`);
        return { success: true, score: percentage, passed };
    } catch (error) {
        console.error(error);
        return { error: "Failed to submit quiz" };
    }
}
