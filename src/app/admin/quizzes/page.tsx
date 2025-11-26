'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, FileQuestion, Link as LinkIcon, Users, Trash2, Edit, Eye } from 'lucide-react';
import { toast } from 'sonner';

interface Quiz {
    id: string;
    title: string;
    description: string | null;
    timeLimit: number | null;
    passScore: number;
    isActive: boolean;
    createdAt: string;
    _count: {
        questions: number;
        links: number;
        attempts: number;
    };
}

export default function QuizManagementPage() {
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchQuizzes();
    }, []);

    const fetchQuizzes = async () => {
        try {
            const res = await fetch('/api/quiz');
            if (res.ok) {
                const data = await res.json();
                setQuizzes(data);
            }
        } catch (error) {
            toast.error('Failed to fetch quizzes');
        } finally {
            setLoading(false);
        }
    };

    const deleteQuiz = async (id: string) => {
        if (!confirm('Are you sure you want to delete this quiz? This action cannot be undone.')) {
            return;
        }

        try {
            const res = await fetch(`/api/quiz?id=${id}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                toast.success('Quiz deleted successfully');
                fetchQuizzes();
            } else {
                toast.error('Failed to delete quiz');
            }
        } catch (error) {
            toast.error('Failed to delete quiz');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Quiz Management</h1>
                    <p className="text-muted-foreground mt-1">
                        Create and manage MCQ quizzes for your employees
                    </p>
                </div>
                <Link href="/admin/quizzes/create">
                    <Button className="gap-2">
                        <Plus className="h-4 w-4" />
                        Create New Quiz
                    </Button>
                </Link>
            </div>

            {quizzes.length === 0 ? (
                <Card className="elevated">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <FileQuestion className="h-16 w-16 text-muted-foreground mb-4" />
                        <h3 className="text-xl font-semibold mb-2">No Quizzes Yet</h3>
                        <p className="text-muted-foreground mb-6 text-center max-w-md">
                            Get started by creating your first quiz. You can add questions manually or import them from Excel.
                        </p>
                        <Link href="/admin/quizzes/create">
                            <Button className="gap-2">
                                <Plus className="h-4 w-4" />
                                Create Your First Quiz
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {quizzes.map((quiz) => (
                        <Card
                            key={quiz.id}
                            className="elevated hover:elevated-lg transition-shadow duration-300"
                        >
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <CardTitle className="text-lg line-clamp-2">
                                        {quiz.title}
                                    </CardTitle>
                                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${quiz.isActive
                                            ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                                            : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                                        }`}>
                                        {quiz.isActive ? 'Active' : 'Inactive'}
                                    </div>
                                </div>
                                {quiz.description && (
                                    <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                                        {quiz.description}
                                    </p>
                                )}
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-3 gap-2 text-center">
                                    <div className="space-y-1">
                                        <FileQuestion className="h-4 w-4 mx-auto text-blue-600" />
                                        <div className="text-2xl font-bold">{quiz._count.questions}</div>
                                        <div className="text-xs text-muted-foreground">Questions</div>
                                    </div>
                                    <div className="space-y-1">
                                        <LinkIcon className="h-4 w-4 mx-auto text-purple-600" />
                                        <div className="text-2xl font-bold">{quiz._count.links}</div>
                                        <div className="text-xs text-muted-foreground">Links</div>
                                    </div>
                                    <div className="space-y-1">
                                        <Users className="h-4 w-4 mx-auto text-green-600" />
                                        <div className="text-2xl font-bold">{quiz._count.attempts}</div>
                                        <div className="text-xs text-muted-foreground">Attempts</div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <div className="grid grid-cols-2 gap-2">
                                        <Link href={`/admin/quizzes/${quiz.id}/edit`}>
                                            <Button variant="outline" size="sm" className="w-full gap-2">
                                                <Edit className="h-3 w-3" />
                                                Edit
                                            </Button>
                                        </Link>
                                        <Link href={`/admin/quizzes/${quiz.id}/links`}>
                                            <Button variant="outline" size="sm" className="w-full gap-2">
                                                <LinkIcon className="h-3 w-3" />
                                                Links
                                            </Button>
                                        </Link>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Link href={`/admin/quizzes/${quiz.id}/results`}>
                                            <Button variant="outline" size="sm" className="w-full gap-2">
                                                <Eye className="h-3 w-3" />
                                                Results
                                            </Button>
                                        </Link>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                                            onClick={() => deleteQuiz(quiz.id)}
                                        >
                                            <Trash2 className="h-3 w-3" />
                                            Delete
                                        </Button>
                                    </div>
                                </div>

                                <div className="text-xs text-muted-foreground pt-2 border-t">
                                    <div className="flex justify-between">
                                        <span>Pass Score:</span>
                                        <span className="font-medium">{quiz.passScore}%</span>
                                    </div>
                                    {quiz.timeLimit && (
                                        <div className="flex justify-between mt-1">
                                            <span>Time Limit:</span>
                                            <span className="font-medium">{quiz.timeLimit} min</span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
