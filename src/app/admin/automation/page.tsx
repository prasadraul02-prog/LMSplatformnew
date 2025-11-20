import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { deleteTrainingRule } from "./actions";
import styles from "../users/users.module.css"; // Reuse styles

export default async function AutomationPage() {
    const rules = await prisma.trainingRule.findMany({
        include: {
            course: true,
            department: true,
            designation: true,
        },
        orderBy: { createdAt: 'desc' },
    });

    return (
        <div>
            <div className={styles.header}>
                <h1 className={styles.title}>Training Rules</h1>
                <Link href="/admin/automation/create" className="btn btn-primary">
                    Create New Rule
                </Link>
            </div>

            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Rule Name</th>
                            <th>Criteria</th>
                            <th>Assigned Course</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rules.map((rule) => (
                            <tr key={rule.id}>
                                <td>{rule.name}</td>
                                <td>
                                    {rule.department ? `Dept: ${rule.department.name}` : ''}
                                    {rule.department && rule.designation ? ' & ' : ''}
                                    {rule.designation ? `Desig: ${rule.designation.name}` : ''}
                                    {!rule.department && !rule.designation ? 'All Employees' : ''}
                                </td>
                                <td>{rule.course.title}</td>
                                <td>
                                    <form action={async () => {
                                        'use server';
                                        await deleteTrainingRule(rule.id);
                                    }}>
                                        <button className={styles.deleteBtn}>Delete</button>
                                    </form>
                                </td>
                            </tr>
                        ))}
                        {rules.length === 0 && (
                            <tr>
                                <td colSpan={4} style={{ textAlign: 'center', padding: '2rem' }}>
                                    No training rules defined.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
