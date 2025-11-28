'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, Check, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { resetUserPassword } from '@/app/admin/users/actions';

interface ResetPasswordDialogProps {
    userId: string;
    userName: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ResetPasswordDialog({ userId, userName, open, onOpenChange }: ResetPasswordDialogProps) {
    const [newPassword, setNewPassword] = useState('');
    const [copied, setCopied] = useState(false);
    const [resetting, setResetting] = useState(false);
    const [mode, setMode] = useState<'auto' | 'manual'>('auto');
    const [manualPassword, setManualPassword] = useState('');

    const handleReset = async () => {
        setResetting(true);
        const result = await resetUserPassword(userId, mode === 'manual' ? manualPassword : undefined);

        if (result.success && result.password) {
            setNewPassword(result.password);
            toast.success('Password reset successfully');
        } else {
            toast.error(result.error || 'Failed to reset password');
        }
        setResetting(false);
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(newPassword);
        setCopied(true);
        toast.success('Password copied to clipboard');
        setTimeout(() => setCopied(false), 2000);
    };

    const handleClose = () => {
        setNewPassword('');
        setCopied(false);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Reset Password</DialogTitle>
                    <DialogDescription>
                        Reset password for {userName}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {!newPassword ? (
                        <div className="space-y-4">
                            <div className="flex gap-4 justify-center mb-4">
                                <Button
                                    variant={mode === 'auto' ? 'default' : 'outline'}
                                    onClick={() => setMode('auto')}
                                    size="sm"
                                >
                                    Auto-Generate
                                </Button>
                                <Button
                                    variant={mode === 'manual' ? 'default' : 'outline'}
                                    onClick={() => setMode('manual')}
                                    size="sm"
                                >
                                    Manual Set
                                </Button>
                            </div>

                            {mode === 'auto' ? (
                                <div className="text-center space-y-4">
                                    <p className="text-sm text-muted-foreground">
                                        Click the button below to generate a new random password
                                    </p>
                                    <Button onClick={handleReset} disabled={resetting} className="gap-2">
                                        <RefreshCw className={`h-4 w-4 ${resetting ? 'animate-spin' : ''}`} />
                                        {resetting ? 'Generating...' : 'Generate New Password'}
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Enter New Password</Label>
                                        <Input
                                            type="text"
                                            value={manualPassword}
                                            onChange={(e) => setManualPassword(e.target.value)}
                                            placeholder="Enter password"
                                        />
                                    </div>
                                    <Button
                                        onClick={handleReset}
                                        disabled={resetting || !manualPassword || manualPassword.length < 6}
                                        className="w-full"
                                    >
                                        {resetting ? 'Setting...' : 'Set Password'}
                                    </Button>
                                    {manualPassword && manualPassword.length < 6 && (
                                        <p className="text-xs text-red-500">Password must be at least 6 characters</p>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>New Password</Label>
                                <div className="flex gap-2">
                                    <Input value={newPassword} readOnly className="font-mono" />
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={copyToClipboard}
                                    >
                                        {copied ? (
                                            <Check className="h-4 w-4 text-green-600" />
                                        ) : (
                                            <Copy className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                            </div>
                            <div className="bg-amber-50 dark:bg-amber-950 p-3 rounded-lg">
                                <p className="text-sm text-amber-800 dark:text-amber-200">
                                    ⚠️ Make sure to copy this password and send it to the user securely.
                                    It won't be shown again.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose}>
                        {newPassword ? 'Done' : 'Cancel'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
