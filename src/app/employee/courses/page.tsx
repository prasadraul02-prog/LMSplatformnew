import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Clock, BarChart } from "lucide-react";

export default async function CoursesPage() {
    const session = await auth();
    if (!session?.user) return null;

    const courses = await prisma.course.findMany({
        where: { published: true },
        include: {
            _count: {
                select: {
                    modules: true
                }
            },
            enrollments: {
                where: { userId: session.user.id },
                select: {
                    progress: true,
                    status: true
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Browse Courses</h1>
                    <p className="text-muted-foreground mt-2">
                        Explore our catalog of training courses and enhance your skills.
                    </p>
                </div>
            </div>

            {courses.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                    <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>No courses available at the moment.</p>
                </div>
            ) : (
                <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {courses.map((course) => {
                        const enrollment = course.enrollments[0];
                        const isEnrolled = !!enrollment;

                        return (
                            <Card key={course.id} className="h-full hover:shadow-xl hover:scale-[1.02] transition-all duration-300 overflow-hidden elevated flex flex-col">
                                <div className="h-48 bg-gradient-to-r from-violet-500 to-indigo-500 relative">
                                    {course.thumbnail ? (
                                        <img
                                            src={course.thumbnail}
                                            alt={course.title}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                                            <BookOpen className="h-16 w-16 text-white/50" />
                                        </div>
                                    )}
                                    <div className="absolute top-4 right-4">
                                        <Badge variant="secondary" className="backdrop-blur-md bg-white/90">
                                            {course.level}
                                        </Badge>
                                    </div>
                                </div>
                                <CardHeader>
                                    <div className="flex items-center justify-between mb-2">
                                        <Badge variant="outline">{course.category}</Badge>
                                    </div>
                                    <CardTitle className="line-clamp-2">{course.title}</CardTitle>
                                </CardHeader>
                                <CardContent className="flex-1 flex flex-col gap-4">
                                    <p className="text-sm text-muted-foreground line-clamp-3 flex-1">
                                        {course.description}
                                    </p>

                                    <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                                        <div className="flex items-center gap-2">
                                            <BookOpen className="h-4 w-4" />
                                            <span>{course._count.modules} Modules</span>
                                        </div>
                                        {/* Add duration if available in schema, otherwise omit or calculate */}
                                    </div>

                                    {isEnrolled ? (
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-muted-foreground">Progress</span>
                                                <span className="font-medium">{enrollment.progress}%</span>
                                            </div>
                                            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-primary transition-all duration-500"
                                                    style={{ width: `${enrollment.progress}%` }}
                                                />
                                            </div>
                                            <Button className="w-full mt-2" asChild>
                                                <Link href={`/employee/courses/${course.id}`}>
                                                    Continue Learning
                                                </Link>
                                            </Button>
                                        </div>
                                    ) : (
                                        <Button className="w-full mt-auto" asChild>
                                            <Link href={`/employee/courses/${course.id}`}>
                                                View Details
                                            </Link>
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
