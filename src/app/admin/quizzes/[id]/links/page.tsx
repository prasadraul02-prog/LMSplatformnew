'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Plus, Copy, Check, Link2, Link2Off, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface QuizLink {
    id: string;
    linkCode: string;
    name: string | null;
    isEnabled: boolean;
    maxUses: number | null;
    currentUses: number;
    expiresAt: string | null;
    createdAt: string;
    _count: {
        attempts: number;
    };
}

export default function QuizLinksPage({ params }: { params: { id: string } }) {
    const [quizId, setQuizId] = useState<string>('');
    const [links, setLinks] = useState<QuizLink[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [copiedCode, setCopiedCode] = useState<string | null>(null);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        maxUses: '',
        expiresAt: '',
        autoDisable: false
    });

    useEffect(() => {
        if (params?.id) {
            setQuizId(params.id);
        }
    }, [params]);

    const fetchLinks = useCallback(async () => {
        if (!quizId) return;
        try {
            const res = await fetch(`/api/quiz/links?quizId=${quizId}`);
            if (res.ok) {
                const data = await res.json();
                setLinks(data);
            }
        } catch (error) {
            toast.error('Failed to fetch links');
        } finally {
            setLoading(false);
        }
    }, [quizId]);

    useEffect(() => {
        fetchLinks();
    }, [fetchLinks]);

    const createLink = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);

        try {
            const payload: any = {
                quizId: quizId,
                name: formData.name || null,
                maxUses: formData.maxUses ? parseInt(formData.maxUses) : null,
                expiresAt: formData.expiresAt || null,
                autoDisable: formData.autoDisable
            };

            const res = await fetch('/api/quiz/links', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                toast.success('Link created successfully');
                setFormData({ name: '', maxUses: '', expiresAt: '', autoDisable: false });
                setShowCreateForm(false);
                fetchLinks();
            } else {
                toast.error('Failed to create link');
            }
        } catch (error) {
            toast.error('Failed to create link');
        } finally {
            setCreating(false);
        }
    };

    const toggleLink = async (linkId: string, isEnabled: boolean) => {
        try {
            const res = await fetch('/api/quiz/links', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ linkId, isEnabled: !isEnabled })
            });

            if (res.ok) {
                toast.success(`Link ${!isEnabled ? 'enabled' : 'disabled'}`);
                fetchLinks();
            } else {
                toast.error('Failed to update link');
            }
        } catch (error) {
            toast.error('Failed to update link');
        }
    };

    const deleteLink = async (linkId: string) => {
        if (!confirm('Are you sure you want to delete this link?')) return;

        try {
            const res = await fetch(`/api/quiz/links?id=${linkId}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                toast.success('Link deleted successfully');
                fetchLinks();
            } else {
                toast.error('Failed to delete link');
            }
        } catch (error) {
            toast.error('Failed to delete link');
        }
    };

    const copyLink = (code: string) => {
        const url = `${window.location.origin}/quiz/${code}`;
        navigator.clipboard.writeText(url);
        setCopiedCode(code);
        toast.success('Link copied to clipboard');
        setTimeout(() => setCopiedCode(null), 2000);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-5xl">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin/quizzes">
                        <Button variant="outline" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Quiz Links</h1>
                        <p className="text-muted-foreground mt-1">
                            Manage shareable links for this quiz
                        </p>
                    </div>
                </div>

                <Button onClick={() => setShowCreateForm(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create New Link
                </Button>
            </div>

            {showCreateForm && (
                <Card className="elevated">
                    <CardHeader>
                        <CardTitle>Create New Link</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={createLink} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Link Name (Optional)</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g., Batch A, Training Session 1"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="maxUses">Max Uses (Optional)</Label>
                                    <Input
                                        id="maxUses"
                                        type="number"
                                        min="1"
                                        value={formData.maxUses}
                                        onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                                        placeholder="Leave empty for unlimited"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="expiresAt">Expires At (Optional)</Label>
                                    <Input
                                        id="expiresAt"
                                        type="datetime-local"
                                        value={formData.expiresAt}
                                        onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="autoDisable"
                                    checked={formData.autoDisable}
                                    onChange={(e) => setFormData({ ...formData, autoDisable: e.target.checked })}
                                    className="rounded"
                                />
                                <Label htmlFor="autoDisable" className="cursor-pointer">
                                    Auto-disable when max uses reached
                                </Label>
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setShowCreateForm(false)}
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={creating} className="flex-1">
                                    {creating ? 'Creating...' : 'Create Link'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {links.length === 0 ? (
                <Card className="elevated">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <h3 className="text-xl font-semibold mb-2">No Links Yet</h3>
                        <p className="text-muted-foreground mb-6">
                            Create a shareable link to allow users to take this quiz
                        </p>
                        <Button onClick={() => setShowCreateForm(true)} className="gap-2">
                            <Plus className="h-4 w-4" />
                            Create First Link
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {links.map((link) => (
                        <Card key={link.id} className="elevated">
                            <CardContent className="pt-6">
                                <div className="space-y-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h3 className="font-semibold text-lg">
                                                    {link.name || 'Unnamed Link'}
                                                </h3>
                                                <div className={`px-2 py-1 rounded-full text-xs font-medium ${link.isEnabled
                                                    ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                                                    : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                                                    }`}>
                                                    {link.isEnabled ? 'Enabled' : 'Disabled'}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 mb-3">
                                                <code className="px-3 py-2 bg-muted rounded text-sm font-mono flex-1">
                                                    {window.location.origin}/quiz/{link.linkCode}
                                                </code>
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    onClick={() => copyLink(link.linkCode)}
                                                >
                                                    {copiedCode === link.linkCode ? (
                                                        <Check className="h-4 w-4 text-green-600" />
                                                    ) : (
                                                        <Copy className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            </div>

                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                <div>
                                                    <div className="text-muted-foreground">Uses</div>
                                                    <div className="font-medium">
                                                        {link.currentUses}{link.maxUses ? ` / ${link.maxUses}` : ''}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="text-muted-foreground">Attempts</div>
                                                    <div className="font-medium">{link._count.attempts}</div>
                                                </div>
                                                <div>
                                                    <div className="text-muted-foreground">Created</div>
                                                    <div className="font-medium">
                                                        {new Date(link.createdAt).toLocaleDateString()}
                                                    </div>
                                                </div>
                                                {link.expiresAt && (
                                                    <div>
                                                        <div className="text-muted-foreground">Expires</div>
                                                        <div className="font-medium">
                                                            {new Date(link.expiresAt).toLocaleDateString()}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 pt-2 border-t">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => toggleLink(link.id, link.isEnabled)}
                                            className="gap-2"
                                        >
                                            {link.isEnabled ? (
                                                <>
                                                    <Link2Off className="h-3 w-3" />
                                                    Disable
                                                </>
                                            ) : (
                                                <>
                                                    <Link2 className="h-3 w-3" />
                                                    Enable
                                                </>
                                            )}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="gap-2 text-red-600 hover:text-red-700"
                                            onClick={() => deleteLink(link.id)}
                                        >
                                            <Trash2 className="h-3 w-3" />
                                            Delete
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
