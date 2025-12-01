import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
    BarChart3,
    FileText,
    Users,
    TrendingUp,
    Award,
    BookOpen,
    ArrowRight
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
            description: "Generate detailed Key Performance Indicator reports based on training levels and compliance.",
            icon: TrendingUp,
            href: "/admin/reports/kpi",
            color: "text-blue-500",
            bgColor: "bg-blue-500/10"
        },
        {
            title: "Organizational Report",
            description: "View comprehensive organizational structure, hierarchy, and department-wise statistics.",
            icon: Users,
            href: "/admin/reports/organizational-report",
            color: "text-purple-500",
            bgColor: "bg-purple-500/10"
        }
    ];

    return (
        <div className="p-6 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
                    <p className="text-muted-foreground mt-2">
                        Monitor training progress, generate reports, and analyze performance.
                    </p>
                </div>
            </div>

            {/* Quick Stats Overview */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                        <Award className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{completionRate}%</div>
                        <p className="text-xs text-muted-foreground">Across all courses</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Enrollments</CardTitle>
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalEnrollments}</div>
                        <p className="text-xs text-muted-foreground">Active learning paths</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Certificates Issued</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{completedEnrollments}</div>
                        <p className="text-xs text-muted-foreground">Successful completions</p>
                    </CardContent>
                </Card>
            </div>

            {/* Report Tools Section */}
            <div>
                <h2 className="text-xl font-semibold mb-4">Report Tools</h2>
                <div className="grid gap-6 md:grid-cols-2">
                    {reportTools.map((tool) => (
                        <Link key={tool.title} href={tool.href}>
                            <Card className="h-full hover:shadow-md transition-shadow cursor-pointer border-l-4" style={{ borderLeftColor: tool.color.includes('blue') ? '#3b82f6' : '#a855f7' }}>
                                <CardHeader>
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2 rounded-lg ${tool.bgColor}`}>
                                            <tool.icon className={`h-6 w-6 ${tool.color}`} />
                                        </div>
                                        <CardTitle className="text-lg">{tool.title}</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <CardDescription className="text-base mb-4">
                                        {tool.description}
                                    </CardDescription>
                                    <Button variant="ghost" className="p-0 h-auto font-medium hover:bg-transparent group">
                                        Open Tool <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                                    </Button>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Department Performance Table */}
            <div>
                <h2 className="text-xl font-semibold mb-4">Department Performance</h2>
                <Card>
                    <CardContent className="p-0">
                        <div className="relative w-full overflow-auto">
                            <table className="w-full caption-bottom text-sm">
                                <thead className="[&_tr]:border-b">
                                    <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Department</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Completion Rate</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Total Enrollments</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Completed</th>
                                    </tr>
                                </thead>
                                <tbody className="[&_tr:last-child]:border-0">
                                    {deptStats.map((stat, idx) => (
                                        <tr key={idx} className="border-b transition-colors hover:bg-muted/50">
                                            <td className="p-4 align-middle font-medium">{stat.name}</td>
                                            <td className="p-4 align-middle">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden w-[100px]">
                                                        <div
                                                            className="h-full bg-primary"
                                                            style={{ width: `${stat.rate}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs text-muted-foreground">{stat.rate}%</span>
                                                </div>
                                            </td>
                                            <td className="p-4 align-middle">{stat.total}</td>
                                            <td className="p-4 align-middle">{stat.completed}</td>
                                        </tr>
                                    ))}
                                    {deptStats.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="p-4 text-center text-muted-foreground">
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
        </div>
    );
}
