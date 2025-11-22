"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
    GraduationCap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";

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

    return (
        <div className="min-h-screen bg-background flex">
            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto",
                    !isSidebarOpen && "-translate-x-full lg:w-20"
                )}
            >
                <div className="h-16 flex items-center justify-center border-b border-border px-4">
                    <div className={cn("font-bold text-xl bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent transition-all", !isSidebarOpen && "scale-0 w-0")}>
                        LMS Portal
                    </div>
                    {!isSidebarOpen && <div className="font-bold text-xl text-primary">L</div>}
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
                                    "flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200 group",
                                    isActive
                                        ? "bg-primary/10 text-primary font-medium"
                                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                )}
                            >
                                <Icon className={cn("h-5 w-5", isActive && "text-primary")} />
                                <span className={cn("transition-opacity duration-200", !isSidebarOpen && "opacity-0 w-0 overflow-hidden")}>
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
                        className={cn("w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10", !isSidebarOpen && "justify-center px-2")}
                        onClick={() => {/* Handle logout */ }}
                    >
                        <LogOut className="h-5 w-5" />
                        <span className={cn("ml-3 transition-opacity duration-200", !isSidebarOpen && "opacity-0 w-0 overflow-hidden")}>
                            Logout
                        </span>
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <header className="h-16 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between px-6">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="lg:hidden"
                    >
                        <Menu className="h-6 w-6" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="hidden lg:flex"
                    >
                        {isSidebarOpen ? <Menu className="h-5 w-5" /> : <Menu className="h-5 w-5 rotate-90" />}
                    </Button>

                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" className="relative">
                            <Bell className="h-5 w-5 text-muted-foreground" />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
                        </Button>
                        <div className="flex items-center gap-3 pl-4 border-l border-border">
                            <div className="text-right hidden md:block">
                                <p className="text-sm font-medium leading-none">{userEmail?.split('@')[0] || 'User'}</p>
                                <p className="text-xs text-muted-foreground">{role}</p>
                            </div>
                            <Avatar>
                                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userEmail}`} />
                                <AvatarFallback>{userEmail?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                            </Avatar>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-6 overflow-y-auto bg-muted/30">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                    >
                        {children}
                    </motion.div>
                </main>
            </div>
        </div>
    );
}
