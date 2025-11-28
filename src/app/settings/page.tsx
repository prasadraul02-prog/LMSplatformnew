import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import SettingsContent from "./settings-content";

export default async function SettingsPage() {
    const session = await auth();

    if (!session?.user) {
        redirect("/login");
    }

    return (
        <DashboardLayout
            role={session.user.role as "ADMIN" | "TRAINER" | "EMPLOYEE"}
            userEmail={session.user.email || undefined}
        >
            <SettingsContent user={session.user} />
        </DashboardLayout>
    );
}
