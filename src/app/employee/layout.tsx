import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";

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
        <DashboardLayout role="EMPLOYEE" userEmail={session.user.email || undefined}>
            {children}
        </DashboardLayout>
    );
}
