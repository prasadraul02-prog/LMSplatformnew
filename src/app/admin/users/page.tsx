import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { deleteUser } from "./actions";
import styles from "./users.module.css";

export default async function UsersPage() {
    const users = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
    });

    return (
        <div>
            <div className={styles.header}>
                <h1 className={styles.title}>User Management</h1>
                <Link href="/admin/users/create" className="btn btn-primary">
                    Add New User
                </Link>
            </div>

            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Created At</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => (
                            <tr key={user.id}>
                                <td>{user.name}</td>
                                <td>{user.email}</td>
                                <td>
                                    <span className={`${styles.badge} ${styles[user.role.toLowerCase()]}`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                                <td>
                                    <form action={async () => {
                                        'use server';
                                        await deleteUser(user.id);
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
