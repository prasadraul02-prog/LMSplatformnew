import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { deleteModule } from "./actions";
import styles from "../../users/users.module.css"; // Reuse styles

export default async function CourseDetailsPage({ params }: { params: { id: string } }) {
    const course = await prisma.course.findUnique({
        where: { id: params.id },
        include: { modules: { orderBy: { order: 'asc' } } },
    });

    if (!course) {
        return <div>Course not found</div>;
    }

    return (
        <div>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>{course.title}</h1>
                    <p style={{ color: 'var(--text-muted)' }}>{course.category} • {course.level}</p>
                </div>
                <Link href={`/admin/courses/${params.id}/modules/create`} className="btn btn-primary">
                    Add Module
                </Link>
            </div>

            <div className="card" style={{ marginBottom: '2rem' }}>
                <h3>Description</h3>
                <p>{course.description}</p>
            </div>

            <h2 style={{ marginBottom: '1rem' }}>Modules</h2>
            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Order</th>
                            <th>Title</th>
                            <th>Type</th>
                            <th>Content</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {course.modules.map((module) => (
                            <tr key={module.id}>
                                <td>{module.order}</td>
                                <td>{module.title}</td>
                                <td>
                                    <span className={styles.badge} style={{ backgroundColor: '#e2e8f0' }}>
                                        {module.type}
                                    </span>
                                </td>
                                <td>{module.contentUrl || '-'}</td>
                                <td>
                                    <form action={async () => {
                                        'use server';
                                        await deleteModule(course.id, module.id);
                                    }}>
                                        <button className={styles.deleteBtn}>Delete</button>
                                    </form>
                                </td>
                            </tr>
                        ))}
                        {course.modules.length === 0 && (
                            <tr>
                                <td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>
                                    No modules added yet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
