'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Book, HelpCircle, ChevronRight, FileText, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export function UserManualContent() {
    const manuals = [
        {
            title: "Organizational Management",
            description: "Manage Master HR Database, compare organizational sheets, and track employee status changes.",
            icon: Users,
            href: "/admin/organizational-status",
            color: "text-blue-600",
            bgColor: "bg-blue-50",
            borderColor: "border-blue-100",
            gradient: "from-blue-500/10 to-blue-500/5"
        },
        {
            title: "Platform Guide",
            description: "Comprehensive guide on how to use the LMS features, create courses, and manage users.",
            icon: Book,
            href: "#",
            color: "text-emerald-600",
            bgColor: "bg-emerald-50",
            borderColor: "border-emerald-100",
            gradient: "from-emerald-500/10 to-emerald-500/5"
        },
        {
            title: "FAQ & Support",
            description: "Common questions and support resources for administrators and trainers.",
            icon: HelpCircle,
            href: "#",
            color: "text-violet-600",
            bgColor: "bg-violet-50",
            borderColor: "border-violet-100",
            gradient: "from-violet-500/10 to-violet-500/5"
        }
    ];

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <div className="space-y-8">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-background p-8 md:p-12">
                <div className="relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent mb-4">
                            User Manual & Resources
                        </h1>
                        <p className="text-lg text-muted-foreground max-w-2xl">
                            Everything you need to manage your organization and master the platform.
                        </p>
                    </motion.div>
                </div>
                <div className="absolute top-0 right-0 -mt-12 -mr-12 opacity-10">
                    <FileText className="w-64 h-64 text-primary" />
                </div>
            </div>

            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
            >
                {manuals.map((manual, index) => (
                    <motion.div key={index} variants={item} className="h-full">
                        <Link href={manual.href} className="group block h-full">
                            <Card className={`h-full border transition-all duration-300 hover:shadow-xl hover:border-primary/20 overflow-hidden relative group-hover:-translate-y-1`}>
                                <div className={`absolute inset-0 bg-gradient-to-br ${manual.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                                <CardHeader className="relative z-10">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`p-3 rounded-xl ${manual.bgColor} group-hover:scale-110 transition-transform duration-300`}>
                                            <manual.icon className={`h-6 w-6 ${manual.color}`} />
                                        </div>
                                        <div className="p-2 rounded-full bg-background/50 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                                            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                    </div>
                                    <CardTitle className="text-xl font-semibold group-hover:text-primary transition-colors">
                                        {manual.title}
                                    </CardTitle>
                                </CardHeader>

                                <CardContent className="relative z-10">
                                    <p className="text-muted-foreground leading-relaxed">
                                        {manual.description}
                                    </p>
                                    <div className="mt-6 flex items-center text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                                        Access Resource <ChevronRight className="ml-1 h-4 w-4" />
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    </motion.div>
                ))}
            </motion.div>
        </div>
    );
}
