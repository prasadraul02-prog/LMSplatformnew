import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import styles from "./admin.module.css";
import ThemeToggle from "@/components/theme-toggle";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    if (session?.user?.role !== "ADMIN") {
        redirect("/dashboard");
    }

    return (
        <div className={styles.layout}>
            <aside className={styles.sidebar}>
                <div className={styles.logo}>LMS Admin</div>
                <nav className={styles.nav}>
                    <Link href="/admin" className={styles.navItem}>Dashboard</Link>
                    <Link href="/admin/users" className={styles.navItem}>Users</Link>
                    <Link href="/admin/courses" className={styles.navItem}>Courses</Link>
                    <Link href="/admin/automation" className={styles.navItem}>Automation</Link>
                    <Link href="/admin/reports" className={styles.navItem}>Reports</Link>
                </nav>
                <div className={styles.user}>
                    {session.user.email}
                </div>
                <div style={{ marginTop: '1rem', paddingLeft: '2rem' }}>
                    <ThemeToggle />
                </div>
            </aside>
            <main className={styles.main}>
                {children}
            </main>
        </div>
    );
}
