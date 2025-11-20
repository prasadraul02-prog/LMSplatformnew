import { prisma } from "@/lib/prisma";
import CreateRuleForm from "./form";
import Link from "next/link";

export default async function CreateRulePage() {
    const departments = await prisma.department.findMany();
    const designations = await prisma.designation.findMany();
    const courses = await prisma.course.findMany();

    return (
        <div>
            <h1 style={{ marginBottom: '2rem' }}>Create Training Rule</h1>
            <div className="card">
                <CreateRuleForm departments={departments} designations={designations} courses={courses} />
            </div>
            <div style={{ marginTop: '1rem' }}>
                <Link href="/admin/automation" className="btn">Back to Rules</Link>
            </div>
        </div>
    );
}
