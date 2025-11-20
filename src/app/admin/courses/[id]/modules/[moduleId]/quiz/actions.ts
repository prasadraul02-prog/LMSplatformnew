'use server';

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const QuestionSchema = z.object({
    text: z.string().min(1, "Question text is required"),
    type: z.enum(["MCQ", "TRUE_FALSE"]),
    options: z.string(), // JSON string of options
    explanation: z.string().optional(),
});

export async function addQuestion(moduleId: string, prevState: any, formData: FormData) {
    const validatedFields = QuestionSchema.safeParse({
        text: formData.get('text'),
        type: formData.get('type'),
        options: formData.get('options'),
        explanation: formData.get('explanation'),
    });

    if (!validatedFields.success) {
        return { error: validatedFields.error.flatten().fieldErrors };
    }

    const { text, type, options, explanation } = validatedFields.data;
    let parsedOptions;
    try {
        parsedOptions = JSON.parse(options);
    } catch (e) {
        return { message: "Invalid options format" };
    }

    try {
        // Ensure Quiz exists for this module
        let quiz = await prisma.quiz.findUnique({ where: { moduleId } });
        if (!quiz) {
            quiz = await prisma.quiz.create({
                data: { moduleId, timeLimit: 30 }, // Default 30 mins
            });
        }

        await prisma.question.create({
            data: {
                quizId: quiz.id,
                text,
                type,
                options: parsedOptions,
                explanation,
            },
        });

        revalidatePath(`/admin/courses`); // Revalidate broadly or specific path
        return { success: true, message: "Question added successfully" };
    } catch (error) {
        return { message: "Failed to add question" };
    }
}

export async function deleteQuestion(questionId: string, moduleId: string) {
    try {
        await prisma.question.delete({ where: { id: questionId } });
        revalidatePath(`/admin/courses`);
        return { success: true };
    } catch (error) {
        return { error: "Failed to delete question" };
    }
}
