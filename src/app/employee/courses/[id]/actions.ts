'use server';

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function markModuleComplete(courseId: string, moduleId: string) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    try {
        const enrollment = await prisma.enrollment.findUnique({
            where: {
                userId_courseId: {
                    userId: session.user.id,
                    courseId: courseId,
                },
            },
        });

        if (!enrollment) return { error: "Not enrolled" };

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

        // Recalculate course progress
        const totalModules = await prisma.module.count({ where: { courseId } });
        const completedModules = await prisma.moduleProgress.count({
            where: {
                enrollmentId: enrollment.id,
                completed: true,
            },
        });

        const progress = Math.round((completedModules / totalModules) * 100);

        await prisma.enrollment.update({
            where: { id: enrollment.id },
            data: { progress },
        });

        revalidatePath(`/employee/courses/${courseId}`);
        return { success: true };
    } catch (error) {
        return { error: "Failed to update progress" };
    }
}
