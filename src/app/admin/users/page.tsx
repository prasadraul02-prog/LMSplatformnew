import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Upload } from "lucide-react";
import { UserTable } from "./user-table";

export const dynamic = 'force-dynamic';

export default async function UsersPage() {
    const users = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
    });

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">User Management (Updated)</h1>
                <div className="flex gap-4">
                    <Link href="/admin/users/import">
                        <Button variant="outline">
                            <Upload className="mr-2 h-4 w-4" />
                            Bulk Import
                        </Button>
                    </Link>
                    <Link href="/admin/users/create">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Add New User
                        </Button>
                    </Link>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Users</CardTitle>
                </CardHeader>
                <CardContent>
                    <UserTable users={users} />
                </CardContent>
            </Card>
        </div>
    );
}
