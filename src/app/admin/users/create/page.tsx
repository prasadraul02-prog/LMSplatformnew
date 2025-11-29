'use client';

import { useFormState } from 'react-dom';
import { createUser, State } from '../actions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AVATAR_OPTIONS, getAvatarUrl } from '@/lib/avatar-options';
import { useState } from 'react';
import { Check, UserPlus, User, Mail, Lock, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function CreateUserPage() {
    const initialState: State = { message: '', error: undefined, success: false };
    const [state, formAction] = useFormState(createUser, initialState);
    const [selectedAvatar, setSelectedAvatar] = useState('bottts');
    const [name, setName] = useState('');

    // Generate a preview URL based on the name (as seed) if no specific avatar is selected, 
    // but here we want to show the selected style.
    // We'll use a placeholder ID 'preview' for the preview if name is empty.
    const previewId = name || 'preview';

    return (
        <div className="container max-w-5xl py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Create New User</h1>
                <p className="text-muted-foreground mt-2">
                    Add a new user to the system and assign their role and avatar.
                </p>
            </div>

            <form action={formAction}>
                <input type="hidden" name="avatar" value={selectedAvatar} />

                <div className="grid gap-6 md:grid-cols-[1fr_400px]">
                    {/* Left Column: User Details */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>User Details</CardTitle>
                                <CardDescription>Enter the personal information for the new user.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Full Name</Label>
                                    <div className="relative">
                                        <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="name"
                                            name="name"
                                            placeholder="John Doe"
                                            className="pl-9"
                                            required
                                            onChange={(e) => setName(e.target.value)}
                                        />
                                    </div>
                                    {state?.error?.name && <p className="text-sm text-red-500">{state.error.name}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input id="email" name="email" type="email" placeholder="john@example.com" className="pl-9" required />
                                    </div>
                                    {state?.error?.email && <p className="text-sm text-red-500">{state.error.email}</p>}
                                    {state?.message && !state.success && <p className="text-sm text-red-500">{state.message}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="password">Password</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input id="password" name="password" type="password" placeholder="••••••••" className="pl-9" required minLength={6} />
                                    </div>
                                    {state?.error?.password && <p className="text-sm text-red-500">{state.error.password}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="role">Role</Label>
                                    <div className="relative">
                                        <Shield className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground z-10" />
                                        <Select name="role" defaultValue="EMPLOYEE">
                                            <SelectTrigger className="pl-9">
                                                <SelectValue placeholder="Select a role" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="EMPLOYEE">Employee</SelectItem>
                                                <SelectItem value="TRAINER">Trainer</SelectItem>
                                                <SelectItem value="ADMIN">Administrator</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Button type="submit" className="w-full md:w-auto" size="lg">
                            <UserPlus className="mr-2 h-4 w-4" />
                            Create User
                        </Button>

                        {state?.success && (
                            <div className="p-4 rounded-md bg-green-50 text-green-700 border border-green-200 flex items-center gap-2">
                                <Check className="h-4 w-4" />
                                {state.message}
                            </div>
                        )}
                    </div>

                    {/* Right Column: Avatar Selection */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Avatar Selection</CardTitle>
                                <CardDescription>Choose a default avatar style.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex justify-center mb-6">
                                    <div className="relative h-32 w-32 rounded-full border-4 border-background shadow-xl overflow-hidden bg-muted">
                                        <img
                                            src={getAvatarUrl(previewId, selectedAvatar)}
                                            alt="Avatar Preview"
                                            className="h-full w-full object-cover"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-3">
                                    {AVATAR_OPTIONS.map((option) => (
                                        <div
                                            key={option.id}
                                            className={`cursor-pointer rounded-lg p-2 border-2 transition-all hover:bg-accent ${selectedAvatar === option.style
                                                ? 'border-primary bg-accent/50'
                                                : 'border-transparent hover:border-muted'
                                                }`}
                                            onClick={() => setSelectedAvatar(option.style)}
                                        >
                                            <div className="aspect-square relative mb-1">
                                                <img
                                                    src={getAvatarUrl(previewId, option.style)}
                                                    alt={option.name}
                                                    className="w-full h-full rounded-full"
                                                />
                                                {selectedAvatar === option.style && (
                                                    <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full p-0.5">
                                                        <Check className="h-2 w-2" />
                                                    </div>
                                                )}
                                            </div>
                                            <p className="text-[10px] text-center font-medium truncate">{option.name}</p>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </form>
        </div>
    );
}
