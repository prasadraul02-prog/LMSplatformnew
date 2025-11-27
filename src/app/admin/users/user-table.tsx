'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit, KeyRound } from "lucide-react";
import { ResetPasswordDialog } from "@/components/admin/reset-password-dialog";
import { EditUserDialog } from "@/components/admin/edit-user-dialog";
import { deleteUser } from "./actions";

export function UserTable({ users }: { users: any[] }) {
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
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive/90"
                            onClick={async () => {
                                if (confirm('Are you sure you want to delete this user?')) {
                                    await deleteUser(user.id);
                                }
                            }}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
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
