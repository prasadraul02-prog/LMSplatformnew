import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import CoursePlayer from "./player";

export default async function CoursePage({ params }: { params: { id: string } }) {
    const session = await auth();
    if (!session?.user) redirect('/login');

    const enrollment = await prisma.enrollment.findUnique({
        where: {
            userId_courseId: {
                userId: session.user.id,
                courseId: params.id,
            },
        },
        include: {
            course: {
                include: {
                    modules: {
                        orderBy: { order: 'asc' },
                    },
                },
            },
            moduleProgress: true,
        },
    });

    if (!enrollment) {
        return <div>You are not enrolled in this course.</div>;
    }

    return <CoursePlayer enrollment={enrollment} />;
}
