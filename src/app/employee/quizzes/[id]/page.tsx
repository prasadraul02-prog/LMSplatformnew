'use client';

import { use } from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileQuestion, Clock, Target, Trophy, ArrowRight } from 'lucide-react';

interface Quiz {
    id: string;
    title: string;
    description: string | null;
    instructions: string | null;
    timeLimit: number | null;
    passScore: number;
    maxAttempts: number | null;
    _count: {
        questions: number;
    };
}

export default function EmployeeQuizDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const router = useRouter();
    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [loading, setLoading] = useState(true);
    const [links, setLinks] = useState<any[]>([]);

    useEffect(() => {
        fetchQuiz();
    }, []);

    const fetchQuiz = async () => {
        try {
            const res = await fetch(`/api/quiz?id=${resolvedParams.id}`);
            if (res.ok) {
                const data = await res.json();
                setQuiz(data);

                // Fetch available links
                const linksRes = await fetch(`/api/quiz/links?quizId=${resolvedParams.id}`);
                if (linksRes.ok) {
                    const linksData = await linksRes.json();
                    // Filter to enabled links only
                    const enabledLinks = linksData.filter((l: any) => l.isEnabled);
                    setLinks(enabledLinks);
                }
            }
        } catch (error) {
            console.error('Error fetching quiz:', error);
        } finally {
            setLoading(false);
        }
    };

    const startQuiz = () => {
        if (links.length > 0) {
            // Use the first available enabled link
            router.push(`/quiz/${links[0].linkCode}`);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!quiz || links.length === 0) {
        return (
            <div className="max-w-2xl mx-auto">
                <Card className="elevated">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <FileQuestion className="h-16 w-16 text-muted-foreground mb-4" />
                        <h3 className="text-xl font-semibold mb-2">Quiz Not Available</h3>
                        <p className="text-muted-foreground text-center mb-6">
                            This quiz is not currently available. Please contact your administrator.
                        </p>
                        <Button onClick={() => router.push('/employee')}>
                            Back to Dashboard
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <Card className="elevated">
                <CardHeader>
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-primary/10 rounded-lg">
                            <FileQuestion className="h-8 w-8 text-primary" />
                        </div>
                        <div className="flex-1">
                            <CardTitle className="text-3xl mb-2">{quiz.title}</CardTitle>
                            {quiz.description && (
                                <p className="text-muted-foreground">{quiz.description}</p>
                            )}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Quiz Info Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                            <FileQuestion className="h-5 w-5 text-blue-600" />
                            <div>
                                <div className="text-2xl font-bold">{quiz._count.questions}</div>
                                <div className="text-xs text-muted-foreground">Questions</div>
                            </div>
                        </div>

                        {quiz.timeLimit && (
                            <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                                <Clock className="h-5 w-5 text-orange-600" />
                                <div>
                                    <div className="text-2xl font-bold">{quiz.timeLimit}</div>
                                    <div className="text-xs text-muted-foreground">Minutes</div>
                                </div>
                            </div>
                        )}

                        <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                            <Target className="h-5 w-5 text-green-600" />
                            <div>
                                <div className="text-2xl font-bold">{quiz.passScore}%</div>
                                <div className="text-xs text-muted-foreground">Pass Score</div>
                            </div>
                        </div>
                    </div>

                    {/* Instructions */}
                    {quiz.instructions && (
                        <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                            <h3 className="font-semibold mb-2 flex items-center gap-2">
                                <Trophy className="h-4 w-4" />
                                Instructions
                            </h3>
                            <p className="text-sm whitespace-pre-line">{quiz.instructions}</p>
                        </div>
                    )}

                    {/* Important Notes */}
                    <div className="bg-amber-50 dark:bg-amber-950 p-4 rounded-lg space-y-2">
                        <h3 className="font-semibold text-amber-900 dark:text-amber-100">Important Notes:</h3>
                        <ul className="text-sm space-y-1 text-amber-800 dark:text-amber-200">
                            {quiz.timeLimit && (
                                <li>• Timer starts when you click "Start Quiz"</li>
                            )}
                            <li>• You can review your answers before submitting</li>
                            <li>• Minimum pass score: {quiz.passScore}%</li>
                            {quiz.maxAttempts && (
                                <li>• Maximum attempts allowed: {quiz.maxAttempts}</li>
                            )}
                            {quiz.timeLimit && (
                                <li>• Quiz will auto-submit when time expires</li>
                            )}
                        </ul>
                    </div>

                    {/* Start Button */}
                    <div className="flex justify-center pt-4">
                        <Button size="lg" onClick={startQuiz} className="gap-2">
                            Start Attempt
                            <ArrowRight className="h-5 w-5" />
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
