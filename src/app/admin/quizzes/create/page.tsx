'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function CreateQuizPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        instructions: '',
        timeLimit: '',
        passScore: '70',
        shuffleQuestions: false,
        shuffleOptions: false,
        showResults: true,
        showAnswers: true,
        allowReview: true,
        maxAttempts: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;

        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.title.trim()) {
            toast.error('Please enter a quiz title');
            return;
        }

        setLoading(true);

        try {
            const payload = {
                title: formData.title,
                description: formData.description || null,
                instructions: formData.instructions || null,
                timeLimit: formData.timeLimit ? parseInt(formData.timeLimit) : null,
                passScore: parseInt(formData.passScore),
                shuffleQuestions: formData.shuffleQuestions,
                shuffleOptions: formData.shuffleOptions,
                showResults: formData.showResults,
                showAnswers: formData.showAnswers,
                allowReview: formData.allowReview,
                maxAttempts: formData.maxAttempts ? parseInt(formData.maxAttempts) : null
            };

            const res = await fetch('/api/quiz', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const quiz = await res.json();
                toast.success('Quiz created successfully!');
                router.push(`/admin/quizzes/${quiz.id}/edit`);
            } else {
                toast.error('Failed to create quiz');
            }
        } catch (error) {
            toast.error('Failed to create quiz');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-4xl">
            <div className="flex items-center gap-4">
                <Link href="/admin/quizzes">
                    <Button variant="outline" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Create New Quiz</h1>
                    <p className="text-muted-foreground mt-1">
                        Set up basic quiz settings. You'll add questions in the next step.
                    </p>
                </div>
            </div>

            <Card className="elevated">
                <CardHeader>
                    <CardTitle>Quiz Settings</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Quiz Title *</Label>
                                <Input
                                    id="title"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    placeholder="Enter quiz title"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    placeholder="Brief description of the quiz"
                                    rows={3}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="instructions">Instructions</Label>
                                <Textarea
                                    id="instructions"
                                    name="instructions"
                                    value={formData.instructions}
                                    onChange={handleChange}
                                    placeholder="Instructions for quiz takers"
                                    rows={4}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="timeLimit">Time Limit (minutes)</Label>
                                    <Input
                                        id="timeLimit"
                                        name="timeLimit"
                                        type="number"
                                        min="1"
                                        value={formData.timeLimit}
                                        onChange={handleChange}
                                        placeholder="Leave empty for no limit"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="passScore">Pass Score (%)</Label>
                                    <Input
                                        id="passScore"
                                        name="passScore"
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={formData.passScore}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="maxAttempts">Max Attempts per User</Label>
                                    <Input
                                        id="maxAttempts"
                                        name="maxAttempts"
                                        type="number"
                                        min="1"
                                        value={formData.maxAttempts}
                                        onChange={handleChange}
                                        placeholder="Leave empty for unlimited"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t">
                            <h3 className="font-semibold">Quiz Options</h3>

                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="shuffleQuestions"
                                        name="shuffleQuestions"
                                        checked={formData.shuffleQuestions}
                                        onChange={handleChange}
                                        className="rounded"
                                    />
                                    <Label htmlFor="shuffleQuestions" className="cursor-pointer">
                                        Shuffle Questions
                                    </Label>
                                </div>

                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="shuffleOptions"
                                        name="shuffleOptions"
                                        checked={formData.shuffleOptions}
                                        onChange={handleChange}
                                        className="rounded"
                                    />
                                    <Label htmlFor="shuffleOptions" className="cursor-pointer">
                                        Shuffle Options
                                    </Label>
                                </div>

                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="showResults"
                                        name="showResults"
                                        checked={formData.showResults}
                                        onChange={handleChange}
                                        className="rounded"
                                    />
                                    <Label htmlFor="showResults" className="cursor-pointer">
                                        Show Results After Submission
                                    </Label>
                                </div>

                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="showAnswers"
                                        name="showAnswers"
                                        checked={formData.showAnswers}
                                        onChange={handleChange}
                                        className="rounded"
                                    />
                                    <Label htmlFor="showAnswers" className="cursor-pointer">
                                        Show Correct Answers After Submission
                                    </Label>
                                </div>

                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="allowReview"
                                        name="allowReview"
                                        checked={formData.allowReview}
                                        onChange={handleChange}
                                        className="rounded"
                                    />
                                    <Label htmlFor="allowReview" className="cursor-pointer">
                                        Allow Review Before Submission
                                    </Label>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <Link href="/admin/quizzes" className="flex-1">
                                <Button type="button" variant="outline" className="w-full">
                                    Cancel
                                </Button>
                            </Link>
                            <Button type="submit" disabled={loading} className="flex-1 gap-2">
                                <Save className="h-4 w-4" />
                                {loading ? 'Creating...' : 'Create Quiz & Add Questions'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
