import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import styles from "./trainer.module.css";

export default async function TrainerLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    if (session?.user?.role !== "TRAINER") {
        redirect("/dashboard");
    }

    return (
        <div className={styles.layout}>
            <aside className={styles.sidebar}>
                <div className={styles.logo}>LMS Trainer</div>
                <nav className={styles.nav}>
                    <Link href="/trainer" className={styles.navItem}>Dashboard</Link>
                    <Link href="/trainer/courses" className={styles.navItem}>My Courses</Link>
                    <Link href="/trainer/quizzes" className={styles.navItem}>Quizzes</Link>
                    <Link href="/trainer/students" className={styles.navItem}>Students</Link>
                </nav>
                <div className={styles.user}>
                    {session.user.email}
                </div>
            </aside>
            <main className={styles.main}>
                {children}
            </main>
        </div>
    );
}
