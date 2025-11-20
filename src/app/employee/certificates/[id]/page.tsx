import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import styles from "./certificate.module.css";

export default async function CertificatePage({ params }: { params: { id: string } }) {
    const session = await auth();
    if (!session?.user) redirect('/login');

    const enrollment = await prisma.enrollment.findUnique({
        where: { id: params.id },
        include: { course: true, user: true },
    });

    if (!enrollment || enrollment.progress < 100) {
        return <div>Certificate not available yet.</div>;
    }

    return (
        <div className={styles.container}>
            <div className={styles.certificate}>
                <div className={styles.header}>
                    <h1>Certificate of Completion</h1>
                </div>
                <div className={styles.body}>
                    <p>This is to certify that</p>
                    <h2>{enrollment.user.name}</h2>
                    <p>has successfully completed the course</p>
                    <h3>{enrollment.course.title}</h3>
                    <p>on {new Date().toLocaleDateString()}</p>
                </div>
                <div className={styles.footer}>
                    <div className={styles.signature}>
                        <div className={styles.line}></div>
                        import {prisma} from "@/lib/prisma";
                        import {auth} from "@/lib/auth";
                        import {redirect} from "next/navigation";
                        import styles from "./certificate.module.css";
                        import PrintButton from "./print-button";

                        export default async function CertificatePage({params}: {params: {id: string } }) {
    const session = await auth();
                        if (!session?.user) redirect('/login');

                        const enrollment = await prisma.enrollment.findUnique({
                            where: {id: params.id },
                        include: {course: true, user: true },
    });

                        if (!enrollment || enrollment.progress < 100) {
        return <div>Certificate not available yet.</div>;
    }

                        return (
                        <div className={styles.container}>
                            <div className={styles.certificate}>
                                <div className={styles.header}>
                                    <h1>Certificate of Completion</h1>
                                </div>
                                <div className={styles.body}>
                                    <p>This is to certify that</p>
                                    <h2>{enrollment.user.name}</h2>
                                    <p>has successfully completed the course</p>
                                    <h3>{enrollment.course.title}</h3>
                                    <p>on {new Date().toLocaleDateString()}</p>
                                </div>
                                <div className={styles.footer}>
                                    <div className={styles.signature}>
                                        <div className={styles.line}></div>
                                        <p>Authorized Signature</p>
                                    </div>
                                    <div className={styles.id}>
                                        ID: {enrollment.id}
                                    </div>
                                </div>
                            </div>
                            <PrintButton />
                        </div>
                        );
}
