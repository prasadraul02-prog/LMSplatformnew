import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
    Users,
    TrendingUp,
    ArrowRight,
    Download
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";


export default async function ReportsPage() {
    const reportTools = [
        {
            title: "KPI Generator",
            description: "Generate detailed Key Performance Indicator reports.",
            icon: TrendingUp,
            href: "/admin/reports/kpi",
        },
        {
            title: "Organizational Report",
            description: "View comprehensive organizational structure reports.",
            icon: Users,
            href: "/admin/reports/organizational-report",
        }
    ];

    return (
        <div className="p-6 md:p-10 space-y-8 bg-background">
            <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
                    <p className="text-muted-foreground mt-2">
                        Monitor training progress and organizational performance.
                    </p>
                </div>
                <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Download Summary
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {reportTools.map((tool) => (
                    <Link key={tool.title} href={tool.href} className="block group">
                        <Card className="h-full hover:border-primary/60 transition-all shadow-sm hover:shadow-md">
                            <CardContent className="p-6 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="flex-shrink-0 p-3 rounded-xl bg-primary/10">
                                        <tool.icon className="h-7 w-7 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg">{tool.title}</h3>
                                        <p className="text-sm text-muted-foreground">{tool.description}</p>
                                    </div>
                                </div>
                                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}


