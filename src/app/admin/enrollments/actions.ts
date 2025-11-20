'use server';

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const EnrollmentSchema = z.object({
    userId: z.string().min(1, "User is required"),
    courseId: z.string().min(1, "Course is required"),
});

export async function createEnrollment(prevState: any, formData: FormData) {
    const validatedFields = EnrollmentSchema.safeParse({
        userId: formData.get('userId'),
        courseId: formData.get('courseId'),
    });

    if (!validatedFields.success) {
        return {
            error: validatedFields.error.flatten().fieldErrors,
        };
    }

    const { userId, courseId } = validatedFields.data;

    try {
        await prisma.enrollment.create({
            data: {
                userId,
                courseId,
                status: 'ACTIVE',
            },
        });

        revalidatePath('/admin/enrollments');
        return { success: true, message: "User enrolled successfully" };
    } catch (error) {
        return { message: "Failed to enroll user (maybe already enrolled?)" };
    }
}
