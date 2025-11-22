import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";

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
        <DashboardLayout role="TRAINER" userEmail={session.user.email || undefined}>
            {children}
        </DashboardLayout>
    );
}
