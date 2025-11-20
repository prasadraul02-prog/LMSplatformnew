import styles from "./dashboard.module.css";

export default function TrainerDashboard() {
    return (
        <div>
            <h1 className={styles.title}>Trainer Dashboard</h1>
            <div className={styles.grid}>
                <div className={styles.card}>
                    <h3>My Courses</h3>
                    <p className={styles.value}>5</p>
                </div>
                <div className={styles.card}>
                    <h3>Total Students</h3>
                    <p className={styles.value}>85</p>
                </div>
                <div className={styles.card}>
                    <h3>Pending Grading</h3>
                    <p className={styles.value}>12</p>
                </div>
            </div>
        </div>
    );
}
