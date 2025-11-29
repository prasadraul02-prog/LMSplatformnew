"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Users,
    BookOpen,
    FileText,
    Settings,
    LogOut,
    Menu,
    X,
    Bell,
    GraduationCap,
    User,
    FileQuestion
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";
import { UserNav } from "@/components/user-nav";

interface DashboardLayoutProps {
    children: React.ReactNode;
    role: "ADMIN" | "TRAINER" | "EMPLOYEE";
    userEmail?: string;
}

export default function DashboardLayout({
    children,
    role,
    userEmail,
}: DashboardLayoutProps) {
    const pathname = usePathname();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const navItems = {
        ADMIN: [
            { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
            { href: "/admin/users", label: "Users", icon: Users },
            { href: "/admin/courses", label: "Courses", icon: BookOpen },
            { href: "/admin/quizzes", label: "Quizzes", icon: FileQuestion },
            { href: "/admin/reports", label: "Reports", icon: FileText },
            { href: "/admin/automation", label: "Automation", icon: Settings },
        ],
        TRAINER: [
            { href: "/trainer", label: "Dashboard", icon: LayoutDashboard },
            { href: "/trainer/courses", label: "My Courses", icon: BookOpen },
            { href: "/trainer/students", label: "Students", icon: Users },
        ],
        EMPLOYEE: [
            { href: "/employee", label: "My Learning", icon: GraduationCap },
            { href: "/employee/courses", label: "Browse Courses", icon: BookOpen },
            { href: "/employee/notifications", label: "Notifications", icon: Bell },
        ],
    };

    const items = navItems[role] || [];

    const handleLogout = async () => {
        await signOut({ callbackUrl: '/login' });
    };

    return (
        <div className="min-h-screen bg-background flex">
            {/* Mobile Backdrop */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsSidebarOpen(false)}
                        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto shadow-xl lg:shadow-none",
                    !isSidebarOpen && "-translate-x-full lg:w-20"
                )}
            >
                <div className="h-16 flex items-center justify-center border-b border-border px-4">
                    <div className={cn("font-bold text-xl bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent transition-all", !isSidebarOpen && "lg:scale-0 lg:w-0")}>
                        LMS Portal
                    </div>
                    <div className={cn("font-bold text-xl text-primary hidden", !isSidebarOpen && "lg:block")}>
                        L
                    </div>
                </div>

                <nav className="p-4 space-y-2">
                    {items.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-3 rounded-md transition-all duration-200 group touch-target",
                                    isActive
                                        ? "bg-primary/10 text-primary font-medium"
                                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground active:scale-95"
                                )}
                                onClick={() => {
                                    // Close mobile sidebar on navigation
                                    if (window.innerWidth < 1024) {
                                        setIsSidebarOpen(false);
                                    }
                                }}
                            >
                                <Icon className={cn("h-5 w-5 flex-shrink-0", isActive && "text-primary")} />
                                <span className={cn("transition-opacity duration-200", !isSidebarOpen && "lg:opacity-0 lg:w-0 lg:overflow-hidden")}>
                                    {item.label}
                                </span>
                                {isActive && isSidebarOpen && (
                                    <motion.div
                                        layoutId="activeNav"
                                        className="ml-auto w-1.5 h-1.5 rounded-full bg-primary"
                                    />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                <div className="absolute bottom-4 left-0 right-0 px-4">
                    <Button
                        variant="ghost"
                        className={cn("w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 touch-target", !isSidebarOpen && "lg:justify-center lg:px-2")}
                        onClick={handleLogout}
                    >
                        <LogOut className="h-5 w-5 flex-shrink-0" />
                        <span className={cn("ml-3 transition-opacity duration-200", !isSidebarOpen && "lg:opacity-0 lg:w-0 lg:overflow-hidden")}>
                            Logout
                        </span>
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <header className="h-16 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="lg:hidden touch-target"
                        aria-label="Toggle menu"
                    >
                        <Menu className="h-6 w-6" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="hidden lg:flex touch-target"
                        aria-label="Toggle sidebar"
                    >
                        {isSidebarOpen ? <Menu className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </Button>

                    <div className="flex items-center gap-2 sm:gap-4">
                        <Link href={role === 'EMPLOYEE' ? '/employee/notifications' : role === 'ADMIN' ? '/admin/notifications' : '#'}>
                            <Button variant="ghost" size="icon" className="relative touch-target" aria-label="Notifications">
                                <Bell className="h-5 w-5 text-muted-foreground" />
                                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
                            </Button>
                        </Link>
                        <div className="flex items-center gap-3 pl-3 sm:pl-4 border-l border-border">
                            <div className="text-right hidden md:block">
                                <p className="text-sm font-medium leading-none">{userEmail?.split('@')[0] || 'User'}</p>
                                <p className="text-xs text-muted-foreground">{role}</p>
                            </div>
                            <UserNav />
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-4 sm:p-6 overflow-y-auto bg-muted/30">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                    >
                        {children}
                    </motion.div>
                </main>
            </div>
        </div>
    );
}
