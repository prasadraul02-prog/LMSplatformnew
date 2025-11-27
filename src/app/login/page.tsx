"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, LayoutDashboard, Mail } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [forgotEmail, setForgotEmail] = useState("");
    const [sendingForgot, setSendingForgot] = useState(false);
    const router = useRouter();

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

    return (
        <div className="min-h-screen w-full flex flex-col lg:flex-row">
            {/* Left Side - Visual (Hidden on mobile) */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center">
                <Image
                    src="/login-bg.png"
                    alt="Background"
                    fill
                    className="object-cover"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-br from-violet-600/90 to-indigo-900/90 z-10" />

                <div className="relative z-20 p-12 text-white max-w-lg animate-fade-in">
                    <div className="mb-8 h-12 w-12 rounded-xl glass flex items-center justify-center glow-primary">
                        <LayoutDashboard className="h-6 w-6 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold mb-6 animate-slide-up">Welcome Back</h1>
                    <p className="text-lg text-slate-200 leading-relaxed animate-slide-up" style={{ animationDelay: "0.1s" }}>
                        "Education is the most powerful weapon which you can use to change the world."
                    </p>
                    <p className="mt-4 text-sm text-slate-400 font-medium animate-slide-up" style={{ animationDelay: "0.2s" }}>- Nelson Mandela</p>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-12 bg-background">
                <div className="w-full max-w-md space-y-8 animate-scale-in">
                    {/* Mobile Logo */}
                    <div className="flex lg:hidden justify-center mb-6">
                        <div className="h-16 w-16 rounded-xl glass-strong flex items-center justify-center glow-primary">
                            <LayoutDashboard className="h-8 w-8 text-primary" />
                        </div>
                    </div>

                    <div className="text-center lg:text-left">
                        <h2 className="text-3xl font-bold tracking-tight">Sign in to your account</h2>
                        <p className="text-muted-foreground mt-2">
                            Enter your email and password to access the portal
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                htmlFor="email"
                            >
                                Email
                            </label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="name@company.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={isLoading}
                                className="h-12 touch-target"
                                autoComplete="email"
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                    htmlFor="password"
                                >
                                    Password
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setShowForgotPassword(true)}
                                    className="text-sm font-medium text-primary hover:underline"
                                >
                                    Forgot password?
                                </button>
                            </div>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={isLoading}
                                className="h-12 touch-target"
                                autoComplete="current-password"
                            />
                        </div>

                        {error && (
                            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm font-medium flex items-center animate-slide-down">
                                <span className="mr-2">⚠️</span> {error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full h-12 text-base touch-target"
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

                    <div className="text-center text-sm text-muted-foreground">
                        Don't have an account?{" "}
                        <a href="#" className="font-medium text-primary hover:underline">
                            Contact Admin
                        </a>
                    </div>
                </div>
            </div>

            {/* Forgot Password Modal */}
            {showForgotPassword && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-background rounded-lg shadow-xl max-w-md w-full p-6 animate-scale-in">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Mail className="h-5 w-5 text-primary" />
                            </div>
                            <h2 className="text-xl font-bold">Forgot Password?</h2>
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
                                    className="h-12"
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
                                    className="flex-1 h-12"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={sendingForgot}
                                    className="flex-1 h-12"
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
