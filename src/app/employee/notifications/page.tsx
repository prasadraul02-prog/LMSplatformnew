import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import styles from "../../admin/users/users.module.css"; // Reuse styles

export default async function NotificationsPage() {
    const session = await auth();
    if (!session?.user) return null;

    const notifications = await prisma.notification.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' },
    });

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h1 style={{ marginBottom: '2rem' }}>Notifications</h1>
            <div className="card">
                {notifications.length === 0 ? (
                    <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No notifications yet.</p>
                ) : (
                    <ul style={{ listStyle: 'none' }}>
                        {notifications.map((n) => (
                            <li key={n.id} style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>
                                <p style={{ marginBottom: '0.5rem' }}>{n.message}</p>
                                <small style={{ color: 'var(--text-muted)' }}>
                                    {new Date(n.createdAt).toLocaleString()}
                                </small>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
