'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import {
    LayoutDashboard,
    Users,
    BookOpen,
    FileQuestion,
    BarChart3,
    Settings,
    Bell,
    Menu,
    X
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { NotificationDropdown } from '@/components/notifications/notification-dropdown';
import { UserNav } from '@/components/user-nav'; // Assuming this exists, if not I'll create a simple one

const navItems = [
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
        title: 'Courses',
        href: '/admin/courses',
        icon: BookOpen,
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
    {
        title: 'Automation',
        href: '/admin/automation',
        icon: Settings,
    },

];

export function HorizontalNav() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);

    return (
        <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center justify-between">
                <div className="flex items-center gap-8">
                    <Link href="/admin/dashboard" className="flex items-center space-x-2">
                        <span className="font-bold text-xl text-primary">LMS Portal</span>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center space-x-6">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "relative flex items-center text-sm font-medium transition-colors hover:text-primary",
                                    pathname.startsWith(item.href)
                                        ? "text-primary"
                                        : "text-muted-foreground"
                                )}
                            >
                                {item.title}
                                {pathname.startsWith(item.href) && (
                                    <motion.div
                                        layoutId="underline"
                                        className="absolute -bottom-[21px] left-0 right-0 h-[2px] bg-primary"
                                        initial={false}
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    />
                                )}
                            </Link>
                        ))}
                    </nav>
                </div>

                <div className="flex items-center gap-4">
                    <NotificationDropdown />
                    <UserNav />

                    {/* Mobile Menu */}
                    <Sheet open={isOpen} onOpenChange={setIsOpen}>
                        <SheetTrigger asChild className="md:hidden">
                            <Button variant="ghost" size="icon">
                                <Menu className="h-5 w-5" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-[240px] sm:w-[300px]">
                            <div className="flex flex-col gap-4 py-4">
                                <Link href="/admin/dashboard" className="font-bold text-xl text-primary mb-4">
                                    LMS Portal
                                </Link>
                                <nav className="flex flex-col gap-2">
                                    {navItems.map((item) => (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={() => setIsOpen(false)}
                                            className={cn(
                                                "flex items-center gap-2 px-2 py-2 text-sm font-medium rounded-md transition-colors",
                                                pathname.startsWith(item.href)
                                                    ? "bg-primary/10 text-primary"
                                                    : "text-muted-foreground hover:bg-muted"
                                            )}
                                        >
                                            <item.icon className="h-4 w-4" />
                                            {item.title}
                                        </Link>
                                    ))}
                                </nav>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </header>
    );
}
