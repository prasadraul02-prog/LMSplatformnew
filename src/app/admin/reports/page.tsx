import { prisma } from "@/lib/prisma";
import styles from "../dashboard.module.css"; // Reuse dashboard styles

export default async function ReportsPage() {
    // Fetch data for reports
    // Fetch data for reports in parallel
    const [
        totalUsers,
        totalCourses,
        totalEnrollments,
        completedEnrollments,
        departments
    ] = await Promise.all([
        prisma.user.count({ where: { role: 'EMPLOYEE' } }),
        prisma.course.count(),
        prisma.enrollment.count(),
        prisma.enrollment.count({ where: { progress: 100 } }),
        prisma.department.findMany({
            select: {
                name: true,
                users: {
                    select: {
                        enrollments: {
                            select: {
                                progress: true
                            }
                        }
                    }
                }
            }
        })
    ]);

    const completionRate = totalEnrollments > 0 ? Math.round((completedEnrollments / totalEnrollments) * 100) : 0;

    const deptStats = departments.map(dept => {
        const deptEnrollments = dept.users.flatMap(u => u.enrollments);
        const deptCompleted = deptEnrollments.filter(e => e.progress === 100).length;
        const deptTotal = deptEnrollments.length;
        const deptRate = deptTotal > 0 ? Math.round((deptCompleted / deptTotal) * 100) : 0;
        return { name: dept.name, rate: deptRate, total: deptTotal, completed: deptCompleted };
    });


    return (
        <div>
            <h1 style={{ marginBottom: '2rem' }}>Reports & Analytics</h1>

            <div className={styles.grid}>
                <div className={styles.card}>
                    <h3>Completion Rate</h3>
                    <div className={styles.number}>{completionRate}%</div>
                    <p>Across all courses</p>
                </div>
                <div className={styles.card}>
                    <h3>Total Enrollments</h3>
                    <div className={styles.number}>{totalEnrollments}</div>
                </div>
                <div className={styles.card}>
                    <h3>Certificates Issued</h3>
                    <div className={styles.number}>{completedEnrollments}</div>
                </div>
            </div>

            <h2 style={{ marginTop: '3rem', marginBottom: '1rem' }}>Department Performance</h2>
            <div className="card">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ textAlign: 'left', borderBottom: '1px solid #eee' }}>
                            <th style={{ padding: '1rem' }}>Department</th>
                            <th style={{ padding: '1rem' }}>Completion Rate</th>
                            <th style={{ padding: '1rem' }}>Total Enrollments</th>
                            <th style={{ padding: '1rem' }}>Completed</th>
                        </tr>
                    </thead>
                    <tbody>
                        {deptStats.map((stat, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '1rem' }}>{stat.name}</td>
                                <td style={{ padding: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{ flex: 1, height: '8px', background: '#eee', borderRadius: '4px', overflow: 'hidden' }}>
                                            <div style={{ width: `${stat.rate}%`, height: '100%', background: 'var(--primary)' }}></div>
                                        </div>
                                        <span>{stat.rate}%</span>
                                    </div>
                                </td>
                                <td style={{ padding: '1rem' }}>{stat.total}</td>
                                <td style={{ padding: '1rem' }}>{stat.completed}</td>
                            </tr>
                        ))}
                        {deptStats.length === 0 && (
                            <tr>
                                <td colSpan={4} style={{ padding: '1rem', textAlign: 'center' }}>No department data available.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
