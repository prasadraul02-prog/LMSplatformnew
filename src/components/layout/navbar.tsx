"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    User,
    Settings,
    Moon,
    Sun,
    Menu,
    X,
    GraduationCap,
    LayoutDashboard,
    Users,
    BookOpen,
    FileQuestion,
    BarChart3,
    Bell
} from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";

export function Navbar() {
    const pathname = usePathname();
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const { theme, setTheme } = useTheme();

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) {
        return null;
    }

    // Hide navbar on login page
    if (pathname === "/" || pathname === "/login") {
        return null;
    }

    const mainNavItems = [
        {
            title: 'Dashboard',
            href: '/admin/dashboard',
            icon: LayoutDashboard,
        },
        {
            title: 'Users',
            href: '/admin/users',
            icon: Users,
        },
        {
            title: 'Quizzes',
            href: '/admin/quizzes',
            icon: FileQuestion,
        },
        {
            title: 'Reports',
            href: '/admin/reports',
            icon: BarChart3,
        },
        {
            title: 'Notifications',
            href: '/admin/notifications/send',
            icon: Bell,
        },
    ];

    const rightMenuItems = [
        {
            title: "Profile",
            href: "/profile",
            icon: User,
            action: null
        },
        {
            title: "Theme",
            href: "#",
            icon: theme === "dark" ? Moon : Sun,
            action: () => setTheme(theme === "dark" ? "light" : "dark")
        }
    ];

    const allMobileItems = [...mainNavItems, ...rightMenuItems];

    return (
        <>
            {/* Navbar Container */}
            <nav className="fixed top-0 left-0 right-0 z-50 h-16 glass border-b border-white/10 dark:border-white/5">
                <div className="container-responsive h-full flex items-center justify-between px-4 lg:px-8">
                    {/* Logo */}
                    <Link href="/dashboard" className="flex items-center gap-3 mr-8">
                        <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary backdrop-blur-sm">
                            <GraduationCap className="h-6 w-6" />
                        </div>
                        <span className="font-bold text-xl tracking-tight text-foreground hidden sm:block">
                            LMS Portal
                        </span>
                    </Link>

                    {/* Main Navigation (Center/Left) */}
                    <div className="hidden lg:flex items-center gap-1 mr-auto">
                        {mainNavItems.map((item) => {
                            const isActive = pathname.startsWith(item.href);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 text-sm font-medium",
                                        isActive
                                            ? "bg-primary/10 text-primary"
                                            : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                                    )}
                                >
                                    <item.icon className={cn("h-4 w-4", isActive ? "text-primary" : "text-muted-foreground")} />
                                    {item.title}
                                </Link>
                            );
                        })}
                    </div>

                    {/* Right Side Actions */}
                    <div className="hidden lg:flex items-center gap-2">
                        {rightMenuItems.map((item) => {
                            const isActive = item.href !== "#" && (pathname === item.href || pathname?.startsWith(item.href + "/"));

                            const ItemContent = (
                                <>
                                    <item.icon className={cn("h-4 w-4 transition-colors", isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary")} />
                                    <span className="font-medium text-sm">{item.title}</span>
                                </>
                            );

                            const className = cn(
                                "flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 group relative overflow-hidden",
                                isActive
                                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 glow-effect glow-primary"
                                    : "text-muted-foreground hover:text-foreground hover:bg-white/10 dark:hover:bg-white/5 glow-effect glow-neutral"
                            );

                            if (item.action) {
                                return (
                                    <button
                                        key={item.title}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            item.action();
                                        }}
                                        className={className}
                                    >
                                        {ItemContent}
                                    </button>
                                );
                            }

                            return (
                                <Link
                                    key={item.title}
                                    href={item.href}
                                    className={className}
                                >
                                    {ItemContent}
                                </Link>
                            );
                        })}
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="lg:hidden">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsMobileOpen(!isMobileOpen)}
                            className="text-foreground"
                        >
                            {isMobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </Button>
                    </div>
                </div>
            </nav>

            {/* Mobile Menu Overlay */}
            {isMobileOpen && (
                <div className="fixed inset-0 z-40 lg:hidden pt-16">
                    <div className="absolute inset-0 bg-background/95 backdrop-blur-md animate-in-fade" onClick={() => setIsMobileOpen(false)} />
                    <div className="relative p-4 space-y-2 animate-in-slide-up">
                        {allMobileItems.map((item) => {
                            const isActive = item.href !== "#" && (pathname === item.href || pathname?.startsWith(item.href + "/"));

                            const className = cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl w-full transition-all duration-200",
                                isActive
                                    ? "bg-primary text-primary-foreground"
                                    : "text-foreground hover:bg-accent"
                            );

                            if (item.action) {
                                return (
                                    <button
                                        key={item.title}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            item.action();
                                            setIsMobileOpen(false);
                                        }}
                                        className={className}
                                    >
                                        <item.icon className="h-5 w-5" />
                                        <span className="font-medium">{item.title}</span>
                                    </button>
                                );
                            }

                            return (
                                <Link
                                    key={item.title}
                                    href={item.href}
                                    onClick={() => setIsMobileOpen(false)}
                                    className={className}
                                >
                                    <item.icon className="h-5 w-5" />
                                    <span className="font-medium">{item.title}</span>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}
        </>
    );
}
