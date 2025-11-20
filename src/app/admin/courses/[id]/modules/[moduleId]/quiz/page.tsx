import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { deleteQuestion } from "./actions";
import AddQuestionForm from "./form";
import styles from "../../../../../users/users.module.css"; // Reuse styles

export default async function QuizManagePage({ params }: { params: { id: string, moduleId: string } }) {
    const moduleData = await prisma.module.findUnique({
        where: { id: params.moduleId },
        include: { quiz: { include: { questions: true } } },
    });

    if (!moduleData) return <div>Module not found</div>;

    const questions = moduleData.quiz?.questions || [];

    return (
        <div>
            <div className={styles.header}>
                <h1 className={styles.title}>Manage Quiz: {moduleData.title}</h1>
                <Link href={`/admin/courses/${params.id}`} className="btn">
                    Back to Course
                </Link>
            </div>

            <div className="card" style={{ marginBottom: '2rem' }}>
                <h2>Add Question</h2>
                <AddQuestionForm moduleId={params.moduleId} />
            </div>

            <h2>Questions ({questions.length})</h2>
            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Question</th>
                            <th>Type</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {questions.map((q) => (
                            <tr key={q.id}>
                                <td>{q.text}</td>
                                <td>{q.type}</td>
                                <td>
                                    <form action={async () => {
                                        'use server';
                                        await deleteQuestion(q.id, params.moduleId);
                                    }}>
                                        <button className={styles.deleteBtn}>Delete</button>
                                    </form>
                                </td>
                            </tr>
                        ))}
                        {questions.length === 0 && (
                            <tr>
                                <td colSpan={3} style={{ textAlign: 'center', padding: '2rem' }}>
                                    No questions added yet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
