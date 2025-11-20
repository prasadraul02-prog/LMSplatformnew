'use server';

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const CourseSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().min(1, "Description is required"),
    category: z.string().min(1, "Category is required"),
    level: z.enum(["BASIC", "INTERMEDIATE", "ADVANCED", "EXPERT"]),
});

export async function createCourse(prevState: any, formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) {
        return { message: "Unauthorized" };
    }

    const validatedFields = CourseSchema.safeParse({
        title: formData.get('title'),
        description: formData.get('description'),
        category: formData.get('category'),
        level: formData.get('level'),
    });

    if (!validatedFields.success) {
        return {
            error: validatedFields.error.flatten().fieldErrors,
        };
    }

    const { title, description, category, level } = validatedFields.data;

    try {
        await prisma.course.create({
            data: {
                title,
                description,
                category,
                level: level as any,
                authorId: session.user.id,
            },
        });

        revalidatePath('/admin/courses');
        return { success: true, message: "Course created successfully" };
    } catch (error) {
        return { message: "Failed to create course" };
    }
}

export async function deleteCourse(id: string) {
    try {
        await prisma.course.delete({
            where: { id },
        });
        revalidatePath('/admin/courses');
        return { success: true };
    } catch (error) {
        return { error: "Failed to delete course" };
    }
}
