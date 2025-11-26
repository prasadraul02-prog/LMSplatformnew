"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, LayoutDashboard } from "lucide-react";
import Image from "next/image";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
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
                                <a href="#" className="text-sm font-medium text-primary hover:underline">
                                    Forgot password?
                                </a>
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
        </div>
    );
}
