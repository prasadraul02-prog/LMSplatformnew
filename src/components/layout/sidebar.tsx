"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Users,
    FileText,
    Settings,
    GraduationCap,
    ClipboardList,
    Menu,
    X,
    LogOut,
    UserCircle
} from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

const sidebarItems = [
    {
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
    },
    {
        title: "Employees",
        href: "/employee",
        icon: Users,
    },
    {
        title: "Training",
        href: "/training",
        icon: GraduationCap,
    },
    {
        title: "Quizzes",
        href: "/quiz",
        icon: ClipboardList,
    },
    {
        title: "Reports",
        href: "/admin/reports",
        icon: FileText,
    },
    {
        title: "Settings",
        href: "/settings",
        icon: Settings,
    },
];

export function Sidebar() {
    const pathname = usePathname();
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) {
        return null;
    }

    return (
        <>
            {/* Mobile Menu Button */}
            <div className="lg:hidden fixed top-4 left-4 z-50">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setIsMobileOpen(!isMobileOpen)}
                    className="bg-background/80 backdrop-blur-sm border-primary/20"
                >
                    {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>
            </div>

            {/* Sidebar Overlay for Mobile */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm animate-in-fade"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            {/* Sidebar Container */}
            <aside
                className={cn(
                    "fixed top-0 left-0 z-40 h-screen w-72 bg-card border-r border-border transition-transform duration-300 ease-in-out lg:translate-x-0 shadow-xl lg:shadow-none",
                    isMobileOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <div className="h-full flex flex-col">
                    {/* Header */}
                    <div className="h-20 flex items-center px-6 border-b border-border/50">
                        <Link href="/dashboard" className="flex items-center gap-2">
                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                <GraduationCap className="h-6 w-6" />
                            </div>
                            <span className="font-bold text-xl tracking-tight text-foreground">
                                LMS Portal
                            </span>
                        </Link>
                    </div>

                    {/* Navigation */}
                    <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
                        <div className="mb-6 px-2">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                                Main Menu
                            </p>
                            <div className="space-y-1">
                                {sidebarItems.map((item) => {
                                    const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={() => setIsMobileOpen(false)}
                                            className={cn(
                                                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative overflow-hidden",
                                                isActive
                                                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 font-medium"
                                                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                                            )}
                                        >
                                            <item.icon className={cn("h-5 w-5 transition-colors", isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary")} />
                                            <span>{item.title}</span>
                                            {isActive && (
                                                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white/20 rounded-l-full" />
                                            )}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-border/50 bg-muted/20 space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                <ThemeToggle />
                                <span>Theme</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-background border border-border/50 shadow-sm">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                <UserCircle className="h-6 w-6" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">Admin User</p>
                                <p className="text-xs text-muted-foreground truncate">admin@example.com</p>
                            </div>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                                <LogOut className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
}
