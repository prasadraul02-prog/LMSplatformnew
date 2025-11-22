import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, CheckCircle, Clock, Award } from "lucide-react";

export default async function EmployeeDashboard() {
  const session = await auth();
  if (!session?.user) return null;

  const enrollments = await prisma.enrollment.findMany({
    where: { userId: session.user.id },
    select: {
      id: true,
      progress: true,
      course: {
        select: {
          id: true,
          title: true
        }
      }
    }
  });

  const inProgress = enrollments.filter(e => e.progress < 100).length;
  const completed = enrollments.filter(e => e.progress === 100).length;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">My Learning Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgress}</div>
            <p className="text-xs text-muted-foreground">Active courses</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completed}</div>
            <p className="text-xs text-muted-foreground">Finished courses</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Certificates</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completed}</div>
            <p className="text-xs text-muted-foreground">Earned certificates</p>
          </CardContent>
        </Card>
      </div>

      {/* Course List */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Continue Learning</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {enrollments.map(enrollment => (
            <Link href={`/employee/courses/${enrollment.course.id}`} key={enrollment.id}>
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer overflow-hidden group">
                <div className="h-32 bg-gradient-to-r from-violet-500 to-indigo-500 group-hover:scale-105 transition-transform duration-300" />
                <CardHeader>
                  <CardTitle className="line-clamp-2">{enrollment.course.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-2 text-sm text-muted-foreground">
                    <span>Progress</span>
                    <span>{enrollment.progress}%</span>
                  </div>
                  <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-500 ease-out"
                      style={{ width: `${enrollment.progress}%` }}
                    />
                  </div>
                  <div className="mt-4">
                    {enrollment.progress === 100 ? (
                      <Badge variant="success" className="bg-green-500 hover:bg-green-600">Completed</Badge>
                    ) : (
                      <Badge variant="secondary">In Progress</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
          {enrollments.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No courses assigned yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
