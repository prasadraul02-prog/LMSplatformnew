"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    User,
    Settings,
    Moon,
    Sun,
    Camera,
    Menu,
    X,
    GraduationCap
} from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";

export function Sidebar() {
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

    const menuItems = [
        {
            title: "Profile",
            href: "/profile",
            icon: User,
            action: null
        },
        {
            title: "Settings",
            href: "/settings",
            icon: Settings,
            action: null
        },
        {
            title: "Theme",
            href: "#",
            icon: theme === "dark" ? Moon : Sun,
            action: () => setTheme(theme === "dark" ? "light" : "dark")
        },
        {
            title: "Avatar Change",
            href: "#",
            icon: Camera,
            action: () => console.log("Open avatar modal") // Placeholder for now
        }
    ];

    return (
        <>
            {/* Mobile Menu Button */}
            <div className="lg:hidden fixed top-4 left-4 z-50">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setIsMobileOpen(!isMobileOpen)}
                    className="bg-background/80 backdrop-blur-sm border-primary/20 glow-effect glow-neutral"
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
                    "fixed top-4 left-4 z-40 h-[calc(100vh-2rem)] w-64 glass rounded-2xl transition-transform duration-300 ease-in-out lg:translate-x-0",
                    isMobileOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <div className="h-full flex flex-col p-4">
                    {/* Header */}
                    <div className="h-16 flex items-center px-2 mb-6">
                        <Link href="/dashboard" className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary backdrop-blur-sm">
                                <GraduationCap className="h-6 w-6" />
                            </div>
                            <span className="font-bold text-xl tracking-tight text-foreground">
                                LMS Portal
                            </span>
                        </Link>
                    </div>

                    {/* Navigation */}
                    <div className="flex-1 space-y-2">
                        {menuItems.map((item) => {
                            const isActive = item.href !== "#" && (pathname === item.href || pathname?.startsWith(item.href + "/"));

                            const ItemContent = (
                                <>
                                    <item.icon className={cn("h-5 w-5 transition-colors", isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary")} />
                                    <span className="font-medium">{item.title}</span>
                                    {isActive && (
                                        <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                    )}
                                </>
                            );

                            const className = cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden",
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
                                            setIsMobileOpen(false);
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
                                    onClick={() => setIsMobileOpen(false)}
                                    className={className}
                                >
                                    {ItemContent}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </aside>
        </>
    );
}
