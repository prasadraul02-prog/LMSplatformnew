import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import QuizTaker from "./taker";

export default async function QuizPage({ params }: { params: { id: string, moduleId: string } }) {
    const session = await auth();
    if (!session?.user) redirect('/login');

    const moduleData = await prisma.module.findUnique({
        where: { id: params.moduleId },
        include: {
            quiz: {
                include: { questions: true }
            }
        },
    });

    if (!moduleData || !moduleData.quiz) {
        return <div>Quiz not found</div>;
    }

    return <QuizTaker quiz={moduleData.quiz} courseId={params.id} moduleId={params.moduleId} />;
}
