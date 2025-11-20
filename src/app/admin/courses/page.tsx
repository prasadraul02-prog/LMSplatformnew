import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { deleteCourse } from "./actions";
import styles from "../users/users.module.css"; // Reuse users styles

export default async function CoursesPage() {
    const courses = await prisma.course.findMany({
        orderBy: { createdAt: 'desc' },
        include: { author: true },
    });

    return (
        <div>
            <div className={styles.header}>
                <h1 className={styles.title}>Course Management</h1>
                <Link href="/admin/courses/create" className="btn btn-primary">
                    Create New Course
                </Link>
            </div>

            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Title</th>
                            <th>Category</th>
                            <th>Level</th>
                            <th>Author</th>
                            <th>Created At</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {courses.map((course) => (
                            <tr key={course.id}>
                                <td>{course.title}</td>
                                <td>{course.category}</td>
                                <td>{course.level}</td>
                                <td>{course.author.name || course.author.email}</td>
                                <td>{new Date(course.createdAt).toLocaleDateString()}</td>
                                <td>
                                    <form action={async () => {
                                        'use server';
                                        await deleteCourse(course.id);
                                    }}>
                                        <button className={styles.deleteBtn}>Delete</button>
                                    </form>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
