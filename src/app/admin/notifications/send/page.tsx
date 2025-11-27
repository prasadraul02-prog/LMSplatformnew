'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Send, Users, User, Shield } from 'lucide-react';

export default function SendNotificationPage() {
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [target, setTarget] = useState('ALL');
    const [role, setRole] = useState('EMPLOYEE');
    const [userId, setUserId] = useState('');
    const [sending, setSending] = useState(false);

    const handleSend = async () => {
        if (!message.trim()) {
            toast.error('Message is required');
            return;
        }

        setSending(true);
        try {
            const res = await fetch('/api/notifications/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    message,
                    target,
                    role: target === 'ROLE' ? role : undefined,
                    userId: target === 'USER' ? userId : undefined,
                }),
            });

            if (res.ok) {
                const data = await res.json();
                toast.success(`Notification sent to ${data.count} users`);
                setTitle('');
                setMessage('');
                setUserId('');
            } else {
                const error = await res.json();
                toast.error(error.error || 'Failed to send notification');
            }
        } catch (error) {
            toast.error('Failed to send notification');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-full">
                    <Send className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Send Notifications</h1>
                    <p className="text-muted-foreground">
                        Send announcements and alerts to users
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Compose Message</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Target Audience</Label>
                        <div className="grid grid-cols-3 gap-4">
                            <Button
                                type="button"
                                variant={target === 'ALL' ? 'default' : 'outline'}
                                className="h-24 flex-col gap-2"
                                onClick={() => setTarget('ALL')}
                            >
                                <Users className="h-6 w-6" />
                                All Users
                            </Button>
                            <Button
                                type="button"
                                variant={target === 'ROLE' ? 'default' : 'outline'}
                                className="h-24 flex-col gap-2"
                                onClick={() => setTarget('ROLE')}
                            >
                                <Shield className="h-6 w-6" />
                                By Role
                            </Button>
                            <Button
                                type="button"
                                variant={target === 'USER' ? 'default' : 'outline'}
                                className="h-24 flex-col gap-2"
                                onClick={() => setTarget('USER')}
                            >
                                <User className="h-6 w-6" />
                                Specific User
                            </Button>
                        </div>
                    </div>

                    {target === 'ROLE' && (
                        <div className="space-y-2">
                            <Label>Select Role</Label>
                            <Select value={role} onValueChange={setRole}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="EMPLOYEE">Employees</SelectItem>
                                    <SelectItem value="TRAINER">Trainers</SelectItem>
                                    <SelectItem value="ADMIN">Admins</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {target === 'USER' && (
                        <div className="space-y-2">
                            <Label>User ID</Label>
                            <Input
                                value={userId}
                                onChange={(e) => setUserId(e.target.value)}
                                placeholder="Enter user ID"
                            />
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label>Title (Optional)</Label>
                        <Input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Notification Title"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Message</Label>
                        <Textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Type your message here..."
                            rows={4}
                        />
                    </div>

                    <Button
                        className="w-full"
                        onClick={handleSend}
                        disabled={sending}
                    >
                        {sending ? 'Sending...' : 'Send Notification'}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
