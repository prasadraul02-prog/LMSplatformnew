import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
    BarChart3,
    FileText,
    Users,
    TrendingUp,
    Award,
    BookOpen,
    ArrowRight,
    Download,
    Search
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default async function ReportsPage() {
    // Fetch data for reports in parallel
    const [
        totalUsers,
        totalCourses,
        totalEnrollments,
        completedEnrollments,
        departments
    ] = await Promise.all([
        prisma.user.count({ where: { role: 'EMPLOYEE' } }),
        prisma.course.count(),
        prisma.enrollment.count(),
        prisma.enrollment.count({ where: { progress: 100 } }),
        prisma.department.findMany({
            select: {
                name: true,
                users: {
                    select: {
                        enrollments: {
                            select: {
                                progress: true
                            }
                        }
                    }
                }
            }
        })
    ]);

    const completionRate = totalEnrollments > 0 ? Math.round((completedEnrollments / totalEnrollments) * 100) : 0;

    const deptStats = departments.map(dept => {
        const deptEnrollments = dept.users.flatMap(u => u.enrollments);
        const deptCompleted = deptEnrollments.filter(e => e.progress === 100).length;
        const deptTotal = deptEnrollments.length;
        const deptRate = deptTotal > 0 ? Math.round((deptCompleted / deptTotal) * 100) : 0;
        return { name: dept.name, rate: deptRate, total: deptTotal, completed: deptCompleted };
    });

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

            {/* Quick Stats Overview */}
            <div className="grid gap-5 sm:gap-6 md:grid-cols-3">
                <Card className="hover:border-primary/60 transition-colors shadow-sm hover:shadow-md group">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                        <Award className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{completionRate}%</div>
                        <p className="text-xs text-muted-foreground">Across all courses</p>
                    </CardContent>
                </Card>
                <Card className="hover:border-primary/60 transition-colors shadow-sm hover:shadow-md group">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Enrollments</CardTitle>
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalEnrollments}</div>
                        <p className="text-xs text-muted-foreground">Active learning paths</p>
                    </CardContent>
                </Card>
                <Card className="hover:border-primary/60 transition-colors shadow-sm hover:shadow-md group">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Certificates Issued</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{completedEnrollments}</div>
                        <p className="text-xs text-muted-foreground">For completed courses</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-8 lg:grid-cols-5 lg:gap-8">
                {/* Main Content: Department Performance */}
                <div className="lg:col-span-3">
                    <Card className="h-full shadow-sm">
                        <CardHeader>
                            <CardTitle>Department Performance</CardTitle>
                            <CardDescription>Completion rates and enrollment stats by department.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="relative w-full overflow-auto">
                                <table className="w-full caption-bottom text-sm">
                                    <thead className="[&_tr]:border-b">
                                        <tr className="border-b transition-colors hover:bg-muted/50">
                                            <th className="h-12 px-4 text-left align-middle font-semibold text-muted-foreground">Department</th>
                                            <th className="h-12 px-4 py-3 text-right align-middle font-semibold text-muted-foreground w-[150px]">Completion Rate</th>
                                            <th className="h-12 px-4 py-3 text-center align-middle font-semibold text-muted-foreground">Enrollments</th>
                                            <th className="h-12 px-4 py-3 text-center align-middle font-semibold text-muted-foreground">Completed</th>
                                        </tr>
                                    </thead>
                                    <tbody className="[&_tr:last-child]:border-0">
                                        {deptStats.map((stat) => (
                                            <tr key={stat.name} className="border-b transition-colors hover:bg-muted/50">
                                                <td className="p-4 align-middle font-medium">{stat.name}</td>
                                                <td className="p-4 align-middle">
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                                                            <div className="h-full bg-primary" style={{ width: `${stat.rate}%` }} />
                                                        </div>
                                                        <span className="text-xs text-muted-foreground font-mono">{stat.rate}%</span>
                                                    </div>
                                                </td>
                                                <td className="p-4 align-middle text-center">{stat.total}</td>
                                                <td className="p-4 align-middle text-center">{stat.completed}</td>
                                            </tr>
                                        ))}
                                        {deptStats.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="p-8 text-center text-muted-foreground">
                                                    No department data available.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Side Content: Report Tools */}
                <div className="lg:col-span-2 space-y-8">
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle>Report Tools</CardTitle>
                            <CardDescription>Generate and view custom reports.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {reportTools.map((tool) => (
                                <Link key={tool.title} href={tool.href} className="block group">
                                    <div className="p-5 rounded-lg border bg-card shadow-md group-hover:shadow-lg transition-all flex items-center justify-between">
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
                                    </div>
                                </Link>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
