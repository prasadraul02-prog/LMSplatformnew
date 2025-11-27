'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle, XCircle, Clock, Send } from 'lucide-react';
import { toast } from 'sonner';

interface QuizOption {
    id: string;
    text: string;
    imageUrl: string | null;
    order: number;
}

interface QuizQuestion {
    id: string;
    text: string;
    imageUrl: string | null;
    explanation: string | null;
    points: number;
    order: number;
    questionType: string;
    options: QuizOption[];
}

interface Quiz {
    id: string;
    title: string;
    description: string | null;
    instructions: string | null;
    timeLimit: number | null;
    passScore: number;
    shuffleQuestions: boolean;
    shuffleOptions: boolean;
    showResults: boolean;
    showAnswers: boolean;
    questions: QuizQuestion[];
}

interface SubmitResult {
    attemptId: string;
    score: number;
    totalPoints: number;
    percentage: number;
    passed: boolean;
    answers?: Array<{
        questionText: string;
        selectedOption: string;
        isCorrect: boolean;
        correctOption: string;
    }>;
}

// Fisher-Yates shuffle algorithm
function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

export default function QuizClient({ code }: { code: string }) {
    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [linkCode, setLinkCode] = useState<string>('');
    const [questions, setQuestions] = useState<QuizQuestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Quiz state
    const [started, setStarted] = useState(false);
    const [employeeName, setEmployeeName] = useState('');
    const [employeeEmail, setEmployeeEmail] = useState('');
    const [employeeId, setEmployeeId] = useState('');
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
    const [startTime, setStartTime] = useState<Date | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [result, setResult] = useState<SubmitResult | null>(null);

    useEffect(() => {
        fetchQuiz();
    }, []);

    // Timer effect
    useEffect(() => {
        if (!started || !timeRemaining || submitted) return;

        const interval = setInterval(() => {
            setTimeRemaining(prev => {
                if (prev === null || prev <= 0) {
                    clearInterval(interval);
                    handleSubmit(); // Auto-submit when time runs out
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [started, timeRemaining, submitted]);

    const fetchQuiz = async () => {
        try {
            const res = await fetch(`/api/quiz/take/${code}`);
            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Failed to load quiz');
                return;
            }

            setQuiz(data.quiz);
            setLinkCode(data.link.linkCode);

            // Prepare questions with shuffling if enabled
            let preparedQuestions = [...data.quiz.questions];

            if (data.quiz.shuffleQuestions) {
                preparedQuestions = shuffleArray(preparedQuestions);
            }

            if (data.quiz.shuffleOptions) {
                preparedQuestions = preparedQuestions.map(q => ({
                    ...q,
                    options: shuffleArray(q.options)
                }));
            }

            setQuestions(preparedQuestions);
        } catch (err) {
            setError('Failed to load quiz');
        } finally {
            setLoading(false);
        }
    };

    const handleStart = () => {
        if (!employeeName.trim() || !employeeEmail.trim()) {
            toast.error('Please enter your name and email');
            return;
        }

        setStarted(true);
        setStartTime(new Date());
        if (quiz?.timeLimit) {
            setTimeRemaining(quiz.timeLimit * 60); // Convert minutes to seconds
        }
    };

    const handleAnswerChange = (questionId: string, optionId: string) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: optionId
        }));
    };

    const handleSubmit = useCallback(async () => {
        if (submitting || submitted) return;

        if (!started) {
            toast.error('Please start the quiz first');
            return;
        }

        // Check if all questions are answered
        const unansweredCount = questions.filter(q => !answers[q.id]).length;
        if (unansweredCount > 0) {
            const confirm = window.confirm(
                `You have ${unansweredCount} unanswered question(s). Do you want to submit anyway?`
            );
            if (!confirm) return;
        }

        setSubmitting(true);

        try {
            const timeSpent = startTime
                ? Math.floor((new Date().getTime() - startTime.getTime()) / 1000)
                : null;

            const payload = {
                linkCode,
                employeeName,
                employeeEmail,
                employeeId: employeeId || null,
                startedAt: startTime,
                timeSpent,
                answers: questions.map(q => ({
                    questionId: q.id,
                    optionId: answers[q.id] || null,
                    timeSpent: null // Could track per-question time if needed
                }))
            };

            const res = await fetch('/api/quiz/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (res.ok) {
                setResult(data);
                setSubmitted(true);
                toast.success('Quiz submitted successfully!');
            } else {
                toast.error(data.error || 'Failed to submit quiz');
                setSubmitting(false);
            }
        } catch (error) {
            toast.error('Failed to submit quiz');
            setSubmitting(false);
        }
    }, [submitting, submitted, started, questions, answers, linkCode, employeeName, employeeEmail, employeeId, startTime]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen p-4">
                <Card className="max-w-md w-full">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <AlertCircle className="h-16 w-16 text-red-600 mb-4" />
                        <h3 className="text-xl font-semibold mb-2">Unable to Load Quiz</h3>
                        <p className="text-muted-foreground text-center">{error}</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (submitted && result) {
        return (
            <div className="min-h-screen p-4 flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
                <Card className="max-w-3xl w-full elevated">
                    <CardHeader className="text-center pb-3">
                        <div className="flex justify-center mb-4">
                            {result.passed ? (
                                <CheckCircle className="h-20 w-20 text-green-600" />
                            ) : (
                                <XCircle className="h-20 w-20 text-red-600" />
                            )}
                        </div>
                        <CardTitle className="text-3xl">
                            {result.passed ? 'Congratulations!' : 'Quiz Completed'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="text-center space-y-2">
                            <div className="text-5xl font-bold text-primary">
                                {result.percentage.toFixed(1)}%
                            </div>
                            <p className="text-muted-foreground">
                                {result.score} / {result.totalPoints} points
                            </p>
                            <p className={`text-lg font-semibold ${result.passed ? 'text-green-600' : 'text-red-600'
                                }`}>
                                {result.passed ? 'You Passed!' : 'You Did Not Pass'}
                            </p>
                        </div>

                        {quiz?.showAnswers && result.answers && (
                            <div className="space-y-3 mt-6">
                                <h3 className="font-semibold text-lg">Review Your Answers</h3>
                                <div className="space-y-3">
                                    {result.answers.map((answer, index) => (
                                        <Card key={index} className={`${answer.isCorrect
                                            ? 'border-green-200 dark:border-green-800'
                                            : 'border-red-200 dark:border-red-800'
                                            }`}>
                                            <CardContent className="p-4">
                                                <div className="flex gap-2">
                                                    {answer.isCorrect ? (
                                                        <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                                                    ) : (
                                                        <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                                                    )}
                                                    <div className="flex-1 space-y-2">
                                                        <p className="font-medium">{answer.questionText}</p>
                                                        <div className="space-y-1 text-sm">
                                                            <p>
                                                                <span className="text-muted-foreground">Your answer: </span>
                                                                <span className={answer.isCorrect ? 'text-green-600' : 'text-red-600'}>
                                                                    {answer.selectedOption}
                                                                </span>
                                                            </p>
                                                            {!answer.isCorrect && (
                                                                <p>
                                                                    <span className="text-muted-foreground">Correct answer: </span>
                                                                    <span className="text-green-600">{answer.correctOption}</span>
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="pt-4 text-center text-sm text-muted-foreground">
                            Thank you for taking the quiz!
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!started) {
        return (
            <div className="min-h-screen p-4 flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
                <Card className="max-w-2xl w-full elevated">
                    <CardHeader>
                        <CardTitle className="text-2xl">{quiz?.title}</CardTitle>
                        {quiz?.description && (
                            <p className="text-muted-foreground mt-2">{quiz.description}</p>
                        )}
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {quiz?.instructions && (
                            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                                <h3 className="font-semibold mb-2">Instructions</h3>
                                <p className="text-sm whitespace-pre-line">{quiz.instructions}</p>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="space-y-1">
                                <div className="text-muted-foreground">Questions</div>
                                <div className="font-semibold text-lg">{questions.length}</div>
                            </div>
                            {quiz?.timeLimit && (
                                <div className="space-y-1">
                                    <div className="text-muted-foreground">Time Limit</div>
                                    <div className="font-semibold text-lg">{quiz.timeLimit} minutes</div>
                                </div>
                            )}
                            <div className="space-y-1">
                                <div className="text-muted-foreground">Pass Score</div>
                                <div className="font-semibold text-lg">{quiz?.passScore}%</div>
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t">
                            <div className="space-y-2">
                                <Label htmlFor="name">Your Name *</Label>
                                <Input
                                    id="name"
                                    value={employeeName}
                                    onChange={(e) => setEmployeeName(e.target.value)}
                                    placeholder="Enter your full name"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Your Email *</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={employeeEmail}
                                    onChange={(e) => setEmployeeEmail(e.target.value)}
                                    placeholder="Enter your email address"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="empId">Employee ID (Optional)</Label>
                                <Input
                                    id="empId"
                                    value={employeeId}
                                    onChange={(e) => setEmployeeId(e.target.value)}
                                    placeholder="Enter your employee ID"
                                />
                            </div>
                        </div>

                        <Button onClick={handleStart} className="w-full" size="lg">
                            Start Quiz
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-4 pb-20 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
            <div className="max-w-4xl mx-auto space-y-4">
                {/* Header with timer */}
                <Card className="elevated sticky top-4 z-10">
                    <CardContent className="py-4">
                        <div className="flex items-center justify-between">
                            <h1 className="text-xl font-bold">{quiz?.title}</h1>
                            {timeRemaining !== null && (
                                <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${timeRemaining < 60
                                    ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
                                    : 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                                    }`}>
                                    <Clock className="h-5 w-5" />
                                    <span className="text-lg font-bold tabular-nums">
                                        {formatTime(timeRemaining)}
                                    </span>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Questions */}
                {questions.map((question, index) => (
                    <Card key={question.id} className="elevated">
                        <CardHeader>
                            <CardTitle className="text-lg">
                                Question {index + 1} of {questions.length}
                                {question.points > 1 && (
                                    <span className="text-sm font-normal text-muted-foreground ml-2">
                                        ({question.points} points)
                                    </span>
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-lg">{question.text}</p>

                            {question.imageUrl && (
                                <img
                                    src={question.imageUrl}
                                    alt="Question"
                                    className="max-w-full h-auto rounded-lg"
                                />
                            )}

                            <div className="space-y-2">
                                {question.options.map((option) => (
                                    <label
                                        key={option.id}
                                        className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${answers[question.id] === option.id
                                            ? 'border-primary bg-primary/5'
                                            : 'border-border hover:border-primary/50'
                                            }`}
                                    >
                                        <input
                                            type={question.questionType === 'SINGLE' ? 'radio' : 'checkbox'}
                                            name={`question-${question.id}`}
                                            value={option.id}
                                            checked={answers[question.id] === option.id}
                                            onChange={() => handleAnswerChange(question.id, option.id)}
                                            className="mt-1"
                                        />
                                        <div className="flex-1">
                                            <p>{option.text}</p>
                                            {option.imageUrl && (
                                                <img
                                                    src={option.imageUrl}
                                                    alt="Option"
                                                    className="mt-2 max-w-xs rounded"
                                                />
                                            )}
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {/* Submit button */}
                <Card className="elevated">
                    <CardContent className="py-6">
                        <div className="flex flex-col items-center gap-4">
                            <p className="text-sm text-muted-foreground">
                                Answered: {Object.keys(answers).length} / {questions.length}
                            </p>
                            <Button
                                onClick={handleSubmit}
                                disabled={submitting}
                                size="lg"
                                className="w-full max-w-md gap-2"
                            >
                                <Send className="h-5 w-5" />
                                {submitting ? 'Submitting...' : 'Submit Quiz'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
