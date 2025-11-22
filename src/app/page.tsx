import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Users, Award, Zap } from "lucide-react";

export default function Home() {
    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Navbar */}
            <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
                <div className="container flex h-16 items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-xl">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white">
                            L
                        </div>
                        <span>LMS Portal</span>
                    </div>
                    <nav className="flex items-center gap-4">
                        <Link href="/login">
                            <Button variant="ghost">Log in</Button>
                        </Link>
                        <Link href="/login">
                            <Button>Get Started</Button>
                        </Link>
                    </nav>
                </div>
            </header>

            <main className="flex-1">
                {/* Hero Section */}
                <section className="py-20 md:py-32 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 via-transparent to-indigo-500/20 -z-10" />
                    <div className="container flex flex-col items-center text-center gap-8">
                        <div className="inline-flex items-center rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-sm font-medium text-violet-800 dark:border-violet-800 dark:bg-violet-950/30 dark:text-violet-300">
                            <Zap className="mr-2 h-3.5 w-3.5" />
                            New: AI-Powered Learning Paths
                        </div>
                        <h1 className="text-4xl md:text-6xl font-bold tracking-tight max-w-3xl">
                            Elevate Your Team's <br />
                            <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                                Potential & Growth
                            </span>
                        </h1>
                        <p className="text-lg text-muted-foreground max-w-2xl">
                            The modern Learning Management System designed for high-performance teams.
                            Streamline training, track progress, and certify skills in one premium platform.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                            <Link href="/login">
                                <Button size="lg" className="w-full sm:w-auto h-12 px-8 text-base">
                                    Start Learning Now
                                </Button>
                            </Link>
                            <Link href="#features">
                                <Button size="lg" variant="outline" className="w-full sm:w-auto h-12 px-8 text-base">
                                    Explore Features
                                </Button>
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section id="features" className="py-20 bg-muted/30">
                    <div className="container">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl font-bold mb-4">Why Choose LMS Portal?</h2>
                            <p className="text-muted-foreground max-w-2xl mx-auto">
                                Everything you need to manage training and development effectively.
                            </p>
                        </div>
                        <div className="grid md:grid-cols-3 gap-8">
                            <Card className="bg-background/50 backdrop-blur border-border/50">
                                <CardHeader>
                                    <BookOpen className="h-10 w-10 text-violet-600 mb-2" />
                                    <CardTitle>Diverse Course Library</CardTitle>
                                </CardHeader>
                                <CardContent className="text-muted-foreground">
                                    Access hundreds of courses across various domains, from technical skills to soft skills.
                                </CardContent>
                            </Card>
                            <Card className="bg-background/50 backdrop-blur border-border/50">
                                <CardHeader>
                                    <Users className="h-10 w-10 text-indigo-600 mb-2" />
                                    <CardTitle>Team Management</CardTitle>
                                </CardHeader>
                                <CardContent className="text-muted-foreground">
                                    Easily manage users, assign roles, and track department-wise progress with intuitive tools.
                                </CardContent>
                            </Card>
                            <Card className="bg-background/50 backdrop-blur border-border/50">
                                <CardHeader>
                                    <Award className="h-10 w-10 text-pink-600 mb-2" />
                                    <CardTitle>Certifications</CardTitle>
                                </CardHeader>
                                <CardContent className="text-muted-foreground">
                                    Auto-generate certificates upon course completion to recognize and reward employee achievements.
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="border-t border-border py-8 bg-background">
                <div className="container flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-sm text-muted-foreground">
                        © 2025 LMS Portal. All rights reserved.
                    </p>
                    <div className="flex gap-6 text-sm text-muted-foreground">
                        <Link href="#" className="hover:text-foreground">Privacy</Link>
                        <Link href="#" className="hover:text-foreground">Terms</Link>
                        <Link href="#" className="hover:text-foreground">Contact</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
