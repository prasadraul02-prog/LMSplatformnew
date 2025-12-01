'use client'

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { addOrganization, updateOrganization, deleteOrganization } from '../actions';
import { toast } from "sonner";
import { Plus, Trash2, Edit2, Save, X, GripVertical } from "lucide-react";

interface Organization {
    id: string;
    name: string;
    order: number;
}

interface OrgSettingsProps {
    organizations: Organization[];
}

export default function OrgSettings({ organizations }: OrgSettingsProps) {
    const [newOrgName, setNewOrgName] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAdd = async () => {
        if (!newOrgName.trim()) return;
        setIsSubmitting(true);
        const result = await addOrganization(newOrgName);
        if (result.success) {
            toast.success(result.message);
            setNewOrgName('');
        } else {
            toast.error(result.error);
        }
        setIsSubmitting(false);
    };

    const handleEditStart = (org: Organization) => {
        setEditingId(org.id);
        setEditName(org.name);
    };

    const handleEditSave = async (org: Organization) => {
        if (!editName.trim()) return;
        setIsSubmitting(true);
        const result = await updateOrganization(org.id, editName, org.order);
        if (result.success) {
            toast.success(result.message);
            setEditingId(null);
        } else {
            toast.error(result.error);
        }
        setIsSubmitting(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure? This will remove the organization from the list.")) return;
        setIsSubmitting(true);
        const result = await deleteOrganization(id);
        if (result.success) {
            toast.success(result.message);
        } else {
            toast.error(result.error);
        }
        setIsSubmitting(false);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Organization Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex gap-2">
                    <Input
                        placeholder="New Organization Name"
                        value={newOrgName}
                        onChange={(e) => setNewOrgName(e.target.value)}
                        disabled={isSubmitting}
                    />
                    <Button onClick={handleAdd} disabled={isSubmitting || !newOrgName.trim()}>
                        <Plus className="mr-2 h-4 w-4" /> Add
                    </Button>
                </div>

                <div className="space-y-2">
                    {organizations.map((org) => (
                        <div key={org.id} className="flex items-center justify-between p-3 border rounded-md bg-muted/50">
                            {editingId === org.id ? (
                                <div className="flex items-center gap-2 flex-1 mr-2">
                                    <Input
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        autoFocus
                                    />
                                                                         <Button size="sm" variant="ghost" onClick={() => handleEditSave(org)}>
                                                                            <Save className="h-4 w-4 text-success" />
                                                                        </Button>                                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                                        <X className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                                    <span className="font-medium">{org.name}</span>
                                </div>
                            )}

                            <div className="flex gap-1">
                                <Button size="sm" variant="ghost" onClick={() => handleEditStart(org)} disabled={isSubmitting}>
                                    <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => handleDelete(org.id)} disabled={isSubmitting}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
