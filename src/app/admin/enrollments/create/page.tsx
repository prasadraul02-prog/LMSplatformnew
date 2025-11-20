import { prisma } from "@/lib/prisma";
import EnrollmentForm from "./form";

export default async function CreateEnrollmentPage() {
    const users = await prisma.user.findMany({
        where: { role: 'EMPLOYEE' },
        select: { id: true, name: true, email: true },
    });

    const courses = await prisma.course.findMany({
        select: { id: true, title: true },
    });

    return (
        <div style={{ maxWidth: '600px' }}>
            <h1 style={{ marginBottom: '2rem' }}>Enroll User in Course</h1>
            <div className="card">
                <EnrollmentForm users={users} courses={courses} />
            </div>
        </div>
    );
}
