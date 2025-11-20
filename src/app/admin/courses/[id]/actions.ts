'use server';

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const ModuleSchema = z.object({
    title: z.string().min(1, "Title is required"),
    type: z.enum(["VIDEO", "PDF", "PPT", "QUIZ", "ASSIGNMENT"]),
    contentUrl: z.string().optional(),
    description: z.string().optional(),
    order: z.coerce.number().int(),
});

export async function createModule(courseId: string, prevState: any, formData: FormData) {
    const validatedFields = ModuleSchema.safeParse({
        title: formData.get('title'),
        type: formData.get('type'),
        contentUrl: formData.get('contentUrl'),
        description: formData.get('description'),
        order: formData.get('order'),
    });

    if (!validatedFields.success) {
        return {
            error: validatedFields.error.flatten().fieldErrors,
        };
    }

    const { title, type, contentUrl, description, order } = validatedFields.data;

    try {
        await prisma.module.create({
            data: {
                courseId,
                title,
                type: type as any,
                contentUrl,
                description,
                order,
            },
        });

        revalidatePath(`/admin/courses/${courseId}`);
        return { success: true, message: "Module added successfully" };
    } catch (error) {
        return { message: "Failed to add module" };
    }
}

export async function deleteModule(courseId: string, moduleId: string) {
    try {
        await prisma.module.delete({
            where: { id: moduleId },
        });
        revalidatePath(`/admin/courses/${courseId}`);
        return { success: true };
    } catch (error) {
        return { error: "Failed to delete module" };
    }
}
