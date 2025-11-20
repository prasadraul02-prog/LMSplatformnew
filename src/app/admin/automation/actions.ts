'use server';

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const RuleSchema = z.object({
    name: z.string().min(1, "Name is required"),
    departmentId: z.string().optional(),
    designationId: z.string().optional(),
    courseId: z.string().min(1, "Course is required"),
});

export type State = {
    error?: {
        name?: string[];
        departmentId?: string[];
        designationId?: string[];
        courseId?: string[];
    };
    message?: string | null;
    success?: boolean;
};

export async function createTrainingRule(prevState: State, formData: FormData): Promise<State> {
    const validatedFields = RuleSchema.safeParse({
        name: formData.get('name'),
        departmentId: formData.get('departmentId') || undefined,
        designationId: formData.get('designationId') || undefined,
        courseId: formData.get('courseId'),
    });

    if (!validatedFields.success) {
        return { error: validatedFields.error.flatten().fieldErrors };
    }

    try {
        await prisma.trainingRule.create({
            data: validatedFields.data,
        });

        // Trigger auto-assignment for existing users matching the rule
        // This is a simplified version; in production, this might be a background job
        const { departmentId, designationId, courseId } = validatedFields.data;

        const usersToEnroll = await prisma.user.findMany({
            where: {
                role: 'EMPLOYEE',
                ...(departmentId && { departmentId }),
                ...(designationId && { designationId }),
                enrollments: {
                    none: {
                        courseId: courseId
                    }
                }
            }
        });

        if (usersToEnroll.length > 0) {
            await prisma.enrollment.createMany({
                data: usersToEnroll.map(user => ({
                    userId: user.id,
                    courseId: courseId,
                    status: 'ACTIVE',
                }))
            });
        }

        revalidatePath('/admin/automation');
        return { success: true, message: `Rule created and ${usersToEnroll.length} users enrolled.` };
    } catch (error) {
        console.error(error);
        return { message: "Failed to create rule" };
    }
}

export async function deleteTrainingRule(id: string) {
    try {
        await prisma.trainingRule.delete({ where: { id } });
        revalidatePath('/admin/automation');
        return { success: true };
    } catch (error) {
        return { error: "Failed to delete rule" };
    }
}
