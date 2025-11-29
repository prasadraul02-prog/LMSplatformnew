'use client';

import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { generateAvatarUrl, getAvatarFallback } from '@/lib/avatar-generator';
import { Badge } from '@/components/ui/badge';
import { Mail, User, Shield, Check } from 'lucide-react';
import { AVATAR_OPTIONS, getAvatarUrl } from '@/lib/avatar-options';
import { Button } from '@/components/ui/button';
import { useState, useTransition } from 'react';
import { updateAvatar } from './actions';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
    const { data: session, update } = useSession();
    const user = session?.user as any;
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    // Local state for immediate feedback, defaulting to user's current avatar or 'dog'
    const [selectedAvatar, setSelectedAvatar] = useState<string>(user?.avatar || 'dog');

    if (!user) {
        return <div className="p-8">Loading...</div>;
    }

    const currentAvatarUrl = user.id ? generateAvatarUrl(user.id, selectedAvatar) : user.image || '';
    const fallback = getAvatarFallback(user.name, user.email || '');

    const handleSaveAvatar = () => {
        startTransition(async () => {
            const result = await updateAvatar(selectedAvatar);
            if (result.success) {
                toast.success("Avatar updated successfully");
                await update(); // Update session
                router.refresh();
            } else {
                toast.error("Failed to update avatar");
            }
        });
    };

    return (
        <div className="container max-w-4xl py-8">
            <h1 className="text-3xl font-bold mb-8">My Profile</h1>

            <div className="grid gap-6 md:grid-cols-[300px_1fr]">
                <div className="space-y-6">
                    <Card>
                        <CardContent className="flex flex-col items-center pt-6 pb-8">
                            <Avatar className="h-32 w-32 mb-4">
                                <AvatarImage src={currentAvatarUrl} alt={user.name || ''} />
                                <AvatarFallback className="text-4xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white">
                                    {fallback}
                                </AvatarFallback>
                            </Avatar>
                            <h2 className="text-2xl font-bold text-center">{user.name}</h2>
                            <p className="text-muted-foreground text-center mb-4">{user.email}</p>
                            <Badge variant="secondary" className="px-4 py-1 text-sm">
                                {user.role}
                            </Badge>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>User Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <User className="h-4 w-4" />
                                        <span className="text-sm font-medium">Full Name</span>
                                    </div>
                                    <p className="font-medium">{user.name}</p>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Mail className="h-4 w-4" />
                                        <span className="text-sm font-medium">Email Address</span>
                                    </div>
                                    <p className="font-medium">{user.email}</p>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Shield className="h-4 w-4" />
                                        <span className="text-sm font-medium">Role</span>
                                    </div>
                                    <p className="font-medium">{user.role}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Choose Your Avatar</CardTitle>
                            <CardDescription>Select a style that represents you best</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-6">
                                {AVATAR_OPTIONS.map((option) => (
                                    <div
                                        key={option.id}
                                        className={`cursor-pointer rounded-lg p-2 border-2 transition-all hover:bg-accent ${selectedAvatar === option.style
                                            ? 'border-primary bg-accent'
                                            : 'border-transparent'
                                            }`}
                                        onClick={() => setSelectedAvatar(option.style)}
                                    >
                                        <div className="aspect-square relative mb-2">
                                            <img
                                                src={getAvatarUrl(user.id, option.style)}
                                                alt={option.name}
                                                className="w-full h-full rounded-full"
                                            />
                                            {selectedAvatar === option.style && (
                                                <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full p-1">
                                                    <Check className="h-3 w-3" />
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-xs text-center font-medium">{option.name}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-end">
                                <Button
                                    onClick={handleSaveAvatar}
                                    disabled={isPending || selectedAvatar === user.avatar}
                                >
                                    {isPending ? 'Saving...' : 'Save Avatar'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
