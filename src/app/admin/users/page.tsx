'use client';

import { useState } from 'react';
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { deleteUser } from "./actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Upload, Trash2, Edit, KeyRound } from "lucide-react";
import { ResetPasswordDialog } from "@/components/admin/reset-password-dialog";
import { EditUserDialog } from "@/components/admin/edit-user-dialog";

async function getUsers() {
    const users = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
    });
    return users;
}

export const dynamic = 'force-dynamic';

export default async function UsersPage() {
    const users = await getUsers();

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

function UserTable({ users }: { users: any[] }) {
    return (
        <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm">
                <thead className="[&_tr]:border-b">
                    <tr className="border-b transition-colors hover:bg-muted/50">
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Name</th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Email</th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Role</th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Created At</th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Actions</th>
                    </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                    {users.map((user) => (
                        <UserRow key={user.id} user={user} />
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function UserRow({ user }: { user: any }) {
    const [resetDialogOpen, setResetDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);

    return (
        <>
            <tr className="border-b transition-colors hover:bg-muted/50">
                <td className="p-4 align-middle font-medium">{user.name}</td>
                <td className="p-4 align-middle">{user.email}</td>
                <td className="p-4 align-middle">
                    <Badge variant={user.role === 'ADMIN' ? 'default' : user.role === 'TRAINER' ? 'secondary' : 'outline'}>
                        {user.role}
                    </Badge>
                </td>
                <td className="p-4 align-middle">{new Date(user.createdAt).toLocaleDateString()}</td>
                <td className="p-4 align-middle">
                    <div className="flex gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditDialogOpen(true)}
                            title="Edit user"
                        >
                            <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setResetDialogOpen(true)}
                            title="Reset password"
                        >
                            <KeyRound className="h-4 w-4" />
                        </Button>
                        <form action={async () => {
                            'use server';
                            await deleteUser(user.id);
                        }}>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/90">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </form>
                    </div>
                </td>
            </tr>

            <ResetPasswordDialog
                userId={user.id}
                userName={user.name || user.email}
                open={resetDialogOpen}
                onOpenChange={setResetDialogOpen}
            />

            <EditUserDialog
                user={user}
                open={editDialogOpen}
                onOpenChange={setEditDialogOpen}
            />
        </>
    );
}
