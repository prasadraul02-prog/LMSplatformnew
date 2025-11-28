'use client';

import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { generateAvatarUrl, getAvatarFallback } from '@/lib/avatar-generator';
import { Badge } from '@/components/ui/badge';
import { Mail, User, Shield, Calendar } from 'lucide-react';

export default function ProfilePage() {
    const { data: session } = useSession();
    const user = session?.user;

    if (!user) {
        return <div className="p-8">Loading...</div>;
    }

    const avatarUrl = user.id ? generateAvatarUrl(user.id) : user.image || '';
    const fallback = getAvatarFallback(user.name, user.email || '');

    return (
        <div className="container max-w-4xl py-8">
            <h1 className="text-3xl font-bold mb-8">My Profile</h1>

            <div className="grid gap-6 md:grid-cols-[300px_1fr]">
                <Card className="h-fit">
                    <CardContent className="flex flex-col items-center pt-6 pb-8">
                        <Avatar className="h-32 w-32 mb-4">
                            <AvatarImage src={avatarUrl} alt={user.name || ''} />
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

                            {/* Add more fields if available in session or fetch from DB */}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
