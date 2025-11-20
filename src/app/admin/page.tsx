import styles from "./dashboard.module.css";

export default function AdminDashboard() {
    return (
        <div>
            <h1 className={styles.title}>Dashboard</h1>
            <div className={styles.grid}>
                <div className={styles.card}>
                    <h3>Total Employees</h3>
                    <p className={styles.value}>120</p>
                </div>
                <div className={styles.card}>
                    <h3>Active Courses</h3>
                    <p className={styles.value}>15</p>
                </div>
                <div className={styles.card}>
                    <h3>Pending Enrollments</h3>
                    <p className={styles.value}>8</p>
                </div>
                <div className={styles.card}>
                    <h3>Completions This Month</h3>
                    <p className={styles.value}>45</p>
                </div>
            </div>
        </div>
    );
}
