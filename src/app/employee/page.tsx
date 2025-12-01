import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, CheckCircle, Clock, Award, FileQuestion, Timer, Target } from "lucide-react";
import { Suspense } from "react";
import { StatsCardSkeleton, CardSkeleton } from "@/components/ui/skeleton";

async function AvailableQuizzes({ userId }: { userId: string }) {
  // Get all active quizzes
  const quizzes = await prisma.standaloneQuiz.findMany({
    where: { isActive: true },
    select: {
      id: true,
      title: true,
      description: true,
      timeLimit: true,
      passScore: true,
      _count: {
        select: {
          questions: true
        }
      },
      attempts: {
        where: { employeeEmail: (await prisma.user.findUnique({ where: { id: userId }, select: { email: true } }))?.email || '' },
        select: {
          id: true,
          passed: true,
          percentage: true,
          submittedAt: true
        },
        orderBy: { submittedAt: 'desc' }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  if (quizzes.length === 0) {
    return (
      <div className="col-span-full text-center py-12 text-muted-foreground animate-fade-in">
        <FileQuestion className="h-12 w-12 mx-auto mb-4 opacity-20" />
        <p>No quizzes available yet.</p>
      </div>
    );
  }

  return (
    <>
      {quizzes.map(quiz => {
        const hasAttempted = quiz.attempts.length > 0;
        const bestAttempt = quiz.attempts.length > 0 ? quiz.attempts[0] : null;

        return (
          <Card key={quiz.id} className="h-full hover:shadow-xl hover:scale-[1.02] transition-all duration-300 overflow-hidden elevated">
            <div className="h-32 bg-gradient-to-r from-primary to-accent relative">
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                <FileQuestion className="h-16 w-16 text-white/90" />
              </div>
            </div>
            <CardHeader>
              <CardTitle className="line-clamp-2">{quiz.title}</CardTitle>
              {quiz.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                  {quiz.description}
                </p>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="flex items-center gap-1">
                  <FileQuestion className="h-3 w-3 text-primary" />
                  <span>{quiz._count.questions} Questions</span>
                </div>
                {quiz.timeLimit && (
                  <div className="flex items-center gap-1">
                    <Timer className="h-3 w-3 text-orange-600" />
                    <span>{quiz.timeLimit} min</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Target className="h-3 w-3 text-success" />
                  <span>{quiz.passScore}% pass</span>
                </div>
              </div>

              {hasAttempted && bestAttempt && (
                <div className="space-y-2 p-3 bg-muted rounded-lg">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Last Attempt:</span>
                    <Badge variant={bestAttempt.passed ? "default" : "destructive"} className={bestAttempt.passed ? "bg-success" : ""}>
                      {bestAttempt.percentage.toFixed(1)}%
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(bestAttempt.submittedAt).toLocaleDateString()}
                  </div>
                </div>
              )}

              <Button className="w-full" variant={hasAttempted ? "outline" : "default"} asChild>
                <Link href={`/employee/quizzes/${quiz.id}`}>
                  {hasAttempted ? 'Retake Quiz' : 'Start Attempt'}
                </Link>
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </>
  );
}

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
            <div className="h-32 bg-gradient-to-r from-primary to-accent group-hover:scale-105 transition-transform duration-300" />
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
                  <Badge variant="success" className="bg-success hover:bg-success/90">Completed</Badge>
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

  const userEmail = (await prisma.user.findUnique({ where: { id: userId }, select: { email: true } }))?.email || '';
  const quizAttempts = await prisma.quizAttempt.findMany({
    where: { employeeEmail: userEmail },
    select: { passed: true }
  });

  const inProgress = enrollments.filter(e => e.progress < 100).length;
  const completed = enrollments.filter(e => e.progress === 100).length;
  const quizzesPassed = quizAttempts.filter(a => a.passed).length;

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-4">
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
      <Card className="elevated hover:elevated-lg transition-shadow duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Quizzes Passed</CardTitle>
          <FileQuestion className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{quizzesPassed}</div>
          <p className="text-xs text-muted-foreground">Assessments passed</p>
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
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-4">
          <StatsCardSkeleton />
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

      {/* Available Quizzes */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Available Quizzes</h2>
        <Suspense fallback={
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        }>
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            <AvailableQuizzes userId={session.user.id} />
          </div>
        </Suspense>
      </div>
    </div>
  );
}
