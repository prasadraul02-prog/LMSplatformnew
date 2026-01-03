"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Loader2,
    LayoutDashboard,
    Mail,
    Eye,
    EyeOff,
    Sun,
    Moon
} from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [forgotEmail, setForgotEmail] = useState("");
    const [sendingForgot, setSendingForgot] = useState(false);

    // Contact Admin States
    const [contactOpen, setContactOpen] = useState(false);
    const [contactEmail, setContactEmail] = useState("");
    const [contactMessage, setContactMessage] = useState("");
    const [sendingContact, setSendingContact] = useState(false);

    const router = useRouter();
    const { theme, setTheme } = useTheme();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const result = await signIn("credentials", {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                setError("Invalid email or password");
                setIsLoading(false);
            } else {
                router.push("/dashboard");
                router.refresh();
            }
        } catch (err) {
            setError("An error occurred. Please try again.");
            setIsLoading(false);
        }
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!forgotEmail) {
            toast.error('Please enter your email address');
            return;
        }

        setSendingForgot(true);

        try {
            const res = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: forgotEmail })
            });

            const data = await res.json();

            if (res.ok) {
                toast.success(data.message || 'Administrator has been notified. You will be contacted shortly.');
                setShowForgotPassword(false);
                setForgotEmail('');
            } else {
                toast.error(data.error || 'Failed to send request');
            }
        } catch (error) {
            toast.error('Failed to send request. Please try again.');
        } finally {
            setSendingForgot(false);
        }
    };

    const handleContactAdmin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!contactEmail || !contactMessage) {
            toast.error('Please fill in all fields');
            return;
        }

        setSendingContact(true);

        try {
            const res = await fetch('/api/contact-admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: contactEmail,
                    message: contactMessage
                })
            });

            const data = await res.json();

            if (res.ok) {
                toast.success('Your message has been sent to the administrator');
                setContactOpen(false);
                setContactEmail('');
                setContactMessage('');
            } else {
                toast.error(data.error || 'Failed to send message');
            }
        } catch (error) {
            toast.error('Failed to send message. Please try again.');
        } finally {
            setSendingContact(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex flex-col lg:flex-row">

            {/* Left Side - Visual (Hidden on mobile) */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center bg-gradient-to-br from-violet-600 via-indigo-600 to-indigo-900">
                <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />

                <div className="relative z-10 p-12 text-white max-w-lg">
                    <div className="mb-8 h-14 w-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <LayoutDashboard className="h-7 w-7 text-white" />
                    </div>
                    <h1 className="text-5xl font-bold mb-6">Welcome Back</h1>

                    <div className="space-y-4 text-slate-200">
                        <div className="flex items-center gap-3">
                            <div className="h-2 w-2 rounded-full bg-white/80" />
                            <span>Track your progress</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="h-2 w-2 rounded-full bg-white/80" />
                            <span>Complete courses & quizzes</span>
                        </div>

                    </div>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-12 bg-background">
                <div className="w-full max-w-md space-y-8">
                    {/* Mobile Logo */}
                    <div className="flex lg:hidden justify-center mb-8">
                        <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                            <LayoutDashboard className="h-8 w-8 text-primary" />
                        </div>
                    </div>

                    <div className="text-center lg:text-left space-y-2">
                        <h2 className="text-3xl font-bold tracking-tight">Sign in to your account</h2>
                        <p className="text-muted-foreground">
                            Enter your credentials to access the portal
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <label
                                className="text-sm font-medium leading-none"
                                htmlFor="email"
                            >
                                Email Address
                            </label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="name@company.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={isLoading}
                                className="h-11"
                                autoComplete="email"
                            />
                        </div>

                        <div className="space-y-2">
                            <label
                                className="text-sm font-medium leading-none"
                                htmlFor="password"
                            >
                                Password
                            </label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    disabled={isLoading}
                                    className="h-11 pr-10"
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </button>
                            </div>

                            {/* Forgot Password Link - Below Password */}
                            <div className="flex justify-end pt-1">
                                <button
                                    type="button"
                                    onClick={() => setShowForgotPassword(true)}
                                    className="text-sm font-medium text-primary hover:underline"
                                >
                                    Forgot password?
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm font-medium flex items-center gap-2">
                                <span>⚠️</span>
                                <span>{error}</span>
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full h-11 text-base"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Signing in...
                                </>
                            ) : (
                                "Sign In"
                            )}
                        </Button>
                    </form>

                    {/* Contact Admin Link */}
                    <div className="text-center text-sm text-muted-foreground">
                        Don't have an account?{" "}
                        <Dialog open={contactOpen} onOpenChange={setContactOpen}>
                            <DialogTrigger asChild>
                                <button className="font-medium text-primary hover:underline">
                                    Contact Admin
                                </button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md">
                                <DialogHeader>
                                    <DialogTitle>Contact Administrator</DialogTitle>
                                    <DialogDescription>
                                        Send a message to the administrator about your issue or request
                                    </DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleContactAdmin} className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">
                                            Your Email
                                        </label>
                                        <Input
                                            type="email"
                                            placeholder="name@company.com"
                                            value={contactEmail}
                                            onChange={(e) => setContactEmail(e.target.value)}
                                            required
                                            disabled={sendingContact}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">
                                            Your Message
                                        </label>
                                        <Textarea
                                            placeholder="Describe the issue you're facing..."
                                            value={contactMessage}
                                            onChange={(e) => setContactMessage(e.target.value)}
                                            required
                                            disabled={sendingContact}
                                            rows={4}
                                        />
                                    </div>
                                    <div className="flex gap-3">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setContactOpen(false)}
                                            disabled={sendingContact}
                                            className="flex-1"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="submit"
                                            disabled={sendingContact}
                                            className="flex-1"
                                        >
                                            {sendingContact ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Sending...
                                                </>
                                            ) : (
                                                'Send Message'
                                            )}
                                        </Button>
                                    </div>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </div>

            {/* Forgot Password Modal */}
            {showForgotPassword && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-background rounded-xl shadow-2xl max-w-md w-full p-6 border">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Mail className="h-6 w-6 text-primary" />
                            </div>
                            <h2 className="text-2xl font-bold">Forgot Password?</h2>
                        </div>

                        <p className="text-sm text-muted-foreground mb-6">
                            Enter your email address and the administrator will be notified to help you recover your account.
                        </p>

                        <form onSubmit={handleForgotPassword} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium" htmlFor="forgot-email">
                                    Email Address
                                </label>
                                <Input
                                    id="forgot-email"
                                    type="email"
                                    placeholder="name@company.com"
                                    value={forgotEmail}
                                    onChange={(e) => setForgotEmail(e.target.value)}
                                    required
                                    disabled={sendingForgot}
                                    className="h-11"
                                />
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setShowForgotPassword(false);
                                        setForgotEmail('');
                                    }}
                                    disabled={sendingForgot}
                                    className="flex-1 h-11"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={sendingForgot}
                                    className="flex-1 h-11"
                                >
                                    {sendingForgot ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Sending...
                                        </>
                                    ) : (
                                        'Send Request'
                                    )}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
