'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, Eye, TrendingUp, Users, Target, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface QuizAttempt {
    id: string;
    employeeName: string;
    employeeEmail: string;
    employeeId: string | null;
    score: number;
    totalPoints: number;
    percentage: number;
    passed: boolean;
    timeSpent: number | null;
    submittedAt: string;
    link: {
        name: string | null;
        linkCode: string;
    } | null;
}

export default function QuizResultsPage({ params }: { params: { id: string } }) {
    const [quizId, setQuizId] = useState<string>('');
    const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalAttempts: 0,
        passedCount: 0,
        averageScore: 0,
        averageTime: 0
    });

    useEffect(() => {
        if (params?.id) {
            setQuizId(params.id);
        }
    }, [params]);

    const fetchResults = useCallback(async () => {
        if (!quizId) return;
        try {
            const res = await fetch(`/api/quiz/results?quizId=${quizId}`);
            if (res.ok) {
                const data = await res.json();
                setAttempts(data);

                // Calculate statistics
                const total = data.length;
                const passed = data.filter((a: QuizAttempt) => a.passed).length;
                const avgScore = total > 0
                    ? data.reduce((sum: number, a: QuizAttempt) => sum + a.percentage, 0) / total
                    : 0;
                const avgTime = total > 0
                    ? data.reduce((sum: number, a: QuizAttempt) => sum + (a.timeSpent || 0), 0) / total
                    : 0;

                setStats({
                    totalAttempts: total,
                    passedCount: passed,
                    averageScore: avgScore,
                    averageTime: avgTime
                });
            }
        } catch (error) {
            toast.error('Failed to fetch results');
        } finally {
            setLoading(false);
        }
    }, [quizId]);

    useEffect(() => {
        fetchResults();
    }, [fetchResults]);

    const downloadCSV = async () => {
        try {
            const res = await fetch(`/api/quiz/results?quizId=${quizId}&format=csv`);
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `quiz-results-${quizId}.csv`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                toast.success('CSV downloaded successfully');
            } else {
                toast.error('Failed to download CSV');
            }
        } catch (error) {
            toast.error('Failed to download CSV');
        }
    };

    const formatTime = (seconds: number | null) => {
        if (!seconds) return 'N/A';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}m ${secs}s`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-7xl">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin/quizzes">
                        <Button variant="outline" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Quiz Results</h1>
                        <p className="text-muted-foreground mt-1">
                            {stats.totalAttempts} total attempt{stats.totalAttempts !== 1 ? 's' : ''}
                        </p>
                    </div>
                </div>

                <Button onClick={downloadCSV} className="gap-2">
                    <Download className="h-4 w-4" />
                    Export CSV
                </Button>
            </div>

            {/* Statistics Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="elevated">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Attempts</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalAttempts}</div>
                    </CardContent>
                </Card>

                <Card className="elevated">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
                        <Target className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats.totalAttempts > 0
                                ? ((stats.passedCount / stats.totalAttempts) * 100).toFixed(1)
                                : 0}%
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {stats.passedCount} passed
                        </p>
                    </CardContent>
                </Card>

                <Card className="elevated">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.averageScore.toFixed(1)}%</div>
                    </CardContent>
                </Card>

                <Card className="elevated">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg. Time Spent</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatTime(Math.floor(stats.averageTime))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Results Table */}
            {attempts.length === 0 ? (
                <Card className="elevated">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Eye className="h-16 w-16 text-muted-foreground mb-4" />
                        <h3 className="text-xl font-semibold mb-2">No Results Yet</h3>
                        <p className="text-muted-foreground">
                            Results will appear here once users start taking the quiz
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <Card className="elevated">
                    <CardHeader>
                        <CardTitle>All Attempts</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left p-3 font-medium">Employee</th>
                                        <th className="text-left p-3 font-medium">Email</th>
                                        <th className="text-left p-3 font-medium">Link</th>
                                        <th className="text-center p-3 font-medium">Score</th>
                                        <th className="text-center p-3 font-medium">Percentage</th>
                                        <th className="text-center p-3 font-medium">Status</th>
                                        <th className="text-center p-3 font-medium">Time</th>
                                        <th className="text-left p-3 font-medium">Submitted</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {attempts.map((attempt) => (
                                        <tr key={attempt.id} className="border-b hover:bg-muted/50">
                                            <td className="p-3">
                                                <div className="font-medium">{attempt.employeeName}</div>
                                                {attempt.employeeId && (
                                                    <div className="text-sm text-muted-foreground">
                                                        ID: {attempt.employeeId}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-3 text-sm">{attempt.employeeEmail}</td>
                                            <td className="p-3 text-sm">
                                                {attempt.link?.name || attempt.link?.linkCode || 'Direct'}
                                            </td>
                                            <td className="p-3 text-center">
                                                <span className="font-medium">
                                                    {attempt.score}/{attempt.totalPoints}
                                                </span>
                                            </td>
                                            <td className="p-3 text-center">
                                                <span className="font-medium">
                                                    {attempt.percentage.toFixed(1)}%
                                                </span>
                                            </td>
                                            <td className="p-3 text-center">
                                                <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${attempt.passed
                                                    ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                                                    : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                                                    }`}>
                                                    {attempt.passed ? 'Passed' : 'Failed'}
                                                </div>
                                            </td>
                                            <td className="p-3 text-center text-sm">
                                                {formatTime(attempt.timeSpent)}
                                            </td>
                                            <td className="p-3 text-sm">
                                                {new Date(attempt.submittedAt).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
