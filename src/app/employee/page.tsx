import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, CheckCircle, Clock, Award } from "lucide-react";
import { Suspense } from "react";
import { StatsCardSkeleton, CardSkeleton } from "@/components/ui/skeleton";

async function CourseEnrollments({ userId }: { userId: string }) {
  const enrollments = await prisma.enrollment.findMany({
    where: { userId },
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

  if (enrollments.length === 0) {
    return (
      <div className="col-span-full text-center py-12 text-muted-foreground animate-fade-in">
        <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-20" />
        <p>No courses assigned yet.</p>
      </div>
    );
  }

  return (
    <>
      {enrollments.map(enrollment => (
        <Link href={`/employee/courses/${enrollment.course.id}`} key={enrollment.id} className="group">
          <Card className="h-full hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer overflow-hidden elevated">
            <div className="h-32 bg-gradient-to-r from-violet-500 to-indigo-500 group-hover:scale-105 transition-transform duration-300" />
            <CardHeader>
              <CardTitle className="line-clamp-2">{enrollment.course.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-2 text-sm text-muted-foreground">
                <span>Progress</span>
                <span className="font-semibold">{enrollment.progress}%</span>
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
    </>
  );
}

async function EnrollmentStats({ userId }: { userId: string }) {
  const enrollments = await prisma.enrollment.findMany({
    where: { userId },
    select: { progress: true }
  });

  const inProgress = enrollments.filter(e => e.progress < 100).length;
  const completed = enrollments.filter(e => e.progress === 100).length;

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
      <Card className="elevated hover:elevated-lg transition-shadow duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">In Progress</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{inProgress}</div>
          <p className="text-xs text-muted-foreground">Active courses</p>
        </CardContent>
      </Card>
      <Card className="elevated hover:elevated-lg transition-shadow duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Completed</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{completed}</div>
          <p className="text-xs text-muted-foreground">Finished courses</p>
        </CardContent>
      </Card>
      <Card className="elevated hover:elevated-lg transition-shadow duration-300">
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
  );
}

export default async function EmployeeDashboard() {
  const session = await auth();
  if (!session?.user) return null;

  return (
    <div className="space-y-8 animate-fade-in">
      <h1 className="text-3xl font-bold tracking-tight">My Learning Dashboard</h1>

      {/* Stats Grid */}
      <Suspense fallback={
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
          <StatsCardSkeleton />
          <StatsCardSkeleton />
          <StatsCardSkeleton />
        </div>
      }>
        <EnrollmentStats userId={session.user.id} />
      </Suspense>

      {/* Course List */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Continue Learning</h2>
        <Suspense fallback={
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        }>
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            <CourseEnrollments userId={session.user.id} />
          </div>
        </Suspense>
      </div>
    </div>
  );
}
