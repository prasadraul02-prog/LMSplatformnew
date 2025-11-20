```
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import Link from "next/link";
import styles from "./dashboard.module.css";

export default async function EmployeeDashboard() {
  const session = await auth();
  if (!session?.user) return null;

  const enrollments = await prisma.enrollment.findMany({
    where: { userId: session.user.id },
    include: { course: true },
  });

  const inProgress = enrollments.filter(e => e.progress < 100).length;
  const completed = enrollments.filter(e => e.progress === 100).length;

  return (
    <div>
      <h1 className={styles.title}>My Learning</h1>
      <div className={styles.grid}>
        <div className={styles.card}>
          <h3>In Progress</h3>
          <p className={styles.value}>{inProgress}</p>
        </div>
        <div className={styles.card}>
          <h3>Completed</h3>
          <p className={styles.value}>{completed}</p>
        </div>
        <div className={styles.card}>
          <h3>Certificates</h3>
          <p className={styles.value}>{completed}</p>
        </div>
      </div>

      <h2 className={styles.sectionTitle}>Continue Learning</h2>
      <div className={styles.courseGrid}>
        {enrollments.map(enrollment => (
          <Link href={`/ employee / courses / ${ enrollment.course.id } `} key={enrollment.id} className={styles.courseCard}>
            <div className={styles.courseImage}></div>
            <div className={styles.courseContent}>
              <h4>{enrollment.course.title}</h4>
              <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: `${ enrollment.progress }% ` }}></div>
              </div>
              <p>{enrollment.progress}% Complete</p>
            </div>
          </Link>
        ))}
        {enrollments.length === 0 && (
          <p>No courses assigned yet.</p>
        )}
      </div>
    </div>
  );
}
```
