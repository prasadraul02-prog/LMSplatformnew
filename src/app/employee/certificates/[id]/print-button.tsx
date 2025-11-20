'use client';

import styles from "./certificate.module.css";

export default function PrintButton() {
    return (
        <button className={styles.printBtn} onClick={() => window.print()}>
            Print Certificate
        </button>
    );
}
