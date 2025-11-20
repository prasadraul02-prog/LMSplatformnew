import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import styles from "./employee.module.css";
import ThemeToggle from "@/components/theme-toggle";

export default async function EmployeeLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    if (session?.user?.role !== "EMPLOYEE") {
        redirect("/dashboard");
    }

    return (
        <div className={styles.layout}>
            <header className={styles.header}>
                <div className={styles.container}>
                    <div className={styles.logo}>LMS Portal</div>
                    <nav className={styles.nav}>
                        <Link href="/employee" className={styles.navItem}>My Learning</Link>
                        <Link href="/employee/catalog" className={styles.navItem}>Course Catalog</Link>
                        <Link href="/employee/achievements" className={styles.navItem}>Achievements</Link>
                        <Link href="/employee/notifications" className={styles.navItem}>Notifications</Link>
                    </nav>
                    <div className={styles.user}>
                        {session.user.name || session.user.email}
                    </div>
                    <div style={{ marginLeft: '1rem' }}>
                        <ThemeToggle />
                    </div>
                </div>
            </header>
            <main className={styles.main}>
                <div className={styles.container}>
                    {children}
                </div>
            </main>
        </div>
    );
}
