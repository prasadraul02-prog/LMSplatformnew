import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { HorizontalNav } from "@/components/admin/horizontal-nav";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    if (session?.user?.role !== "ADMIN") {
        redirect("/dashboard");
    }

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <HorizontalNav />
            <main className="flex-1 w-full">
                <div className="container-responsive py-6 md:py-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
