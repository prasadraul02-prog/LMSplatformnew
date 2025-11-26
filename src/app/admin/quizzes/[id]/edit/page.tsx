'use client';

import { useState, useEffect } from 'react';
import { use } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    ArrowLeft,
    Plus,
    Save,
    Trash2,
    Upload,
    FileSpreadsheet,
    Image as ImageIcon,
    X
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface QuizOption {
    id?: string;
    text: string;
    imageUrl?: string | null;
    isCorrect: boolean;
    order: number;
}

interface QuizQuestion {
    id?: string;
    text: string;
    imageUrl?: string | null;
    explanation?: string | null;
    points: number;
    order: number;
    questionType: string;
    options: QuizOption[];
}

interface Quiz {
    id: string;
    title: string;
    description: string | null;
    questions: QuizQuestion[];
}

export default function EditQuizPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const router = useRouter();
    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [questions, setQuestions] = useState<QuizQuestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [importingExcel, setImportingExcel] = useState(false);

    useEffect(() => {
        fetchQuiz();
    }, []);

    const fetchQuiz = async () => {
        try {
            const res = await fetch(`/api/quiz?id=${resolvedParams.id}`);
            if (res.ok) {
                const data = await res.json();
                setQuiz(data);
                setQuestions(data.questions || []);
            } else {
                toast.error('Failed to fetch quiz');
                router.push('/admin/quizzes');
            }
        } catch (error) {
            toast.error('Failed to fetch quiz');
        } finally {
            setLoading(false);
        }
    };

    const addQuestion = () => {
        const newQuestion: QuizQuestion = {
            text: '',
            explanation: '',
            points: 1,
            order: questions.length,
            questionType: 'SINGLE',
            options: [
                { text: '', isCorrect: false, order: 0 },
                { text: '', isCorrect: false, order: 1 },
                { text: '', isCorrect: false, order: 2 },
                { text: '', isCorrect: false, order: 3 }
            ]
        };
        setQuestions([...questions, newQuestion]);
    };

    const updateQuestion = (index: number, field: string, value: any) => {
        const updated = [...questions];
        updated[index] = { ...updated[index], [field]: value };
        setQuestions(updated);
    };

    const updateOption = (questionIndex: number, optionIndex: number, field: string, value: any) => {
        const updated = [...questions];
        updated[questionIndex].options[optionIndex] = {
            ...updated[questionIndex].options[optionIndex],
            [field]: value
        };
        setQuestions(updated);
    };

    const addOption = (questionIndex: number) => {
        const updated = [...questions];
        const newOption: QuizOption = {
            text: '',
            isCorrect: false,
            order: updated[questionIndex].options.length
        };
        updated[questionIndex].options.push(newOption);
        setQuestions(updated);
    };

    const removeOption = (questionIndex: number, optionIndex: number) => {
        const updated = [...questions];
        updated[questionIndex].options.splice(optionIndex, 1);
        // Reorder remaining options
        updated[questionIndex].options.forEach((opt, idx) => {
            opt.order = idx;
        });
        setQuestions(updated);
    };

    const removeQuestion = (index: number) => {
        if (!confirm('Are you sure you want to delete this question?')) return;
        const updated = questions.filter((_, i) => i !== index);
        // Reorder questions
        updated.forEach((q, idx) => {
            q.order = idx;
        });
        setQuestions(updated);
    };

    const handleImageUpload = async (file: File, questionIndex: number, optionIndex?: number) => {
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/quiz/upload-image', {
                method: 'POST',
                body: formData
            });

            if (res.ok) {
                const { url } = await res.json();

                if (optionIndex !== undefined) {
                    updateOption(questionIndex, optionIndex, 'imageUrl', url);
                } else {
                    updateQuestion(questionIndex, 'imageUrl', url);
                }

                toast.success('Image uploaded successfully');
            } else {
                toast.error('Failed to upload image');
            }
        } catch (error) {
            toast.error('Failed to upload image');
        }
    };

    const handleExcelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setImportingExcel(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('quizId', resolvedParams.id);

        try {
            const res = await fetch('/api/quiz/import', {
                method: 'POST',
                body: formData
            });

            if (res.ok) {
                const data = await res.json();
                toast.success(`Imported ${data.imported} questions successfully`);
                fetchQuiz();
            } else {
                const error = await res.json();
                toast.error(error.error || 'Failed to import questions');
            }
        } catch (error) {
            toast.error('Failed to import questions');
        } finally {
            setImportingExcel(false);
            e.target.value = '';
        }
    };

    const saveQuestions = async () => {
        if (questions.length === 0) {
            toast.error('Please add at least one question');
            return;
        }

        // Validate questions
        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            if (!q.text.trim()) {
                toast.error(`Question ${i + 1} is empty`);
                return;
            }
            if (q.options.length < 2) {
                toast.error(`Question ${i + 1} must have at least 2 options`);
                return;
            }
            if (!q.options.some(opt => opt.isCorrect)) {
                toast.error(`Question ${i + 1} must have at least one correct answer`);
                return;
            }
            for (let j = 0; j < q.options.length; j++) {
                if (!q.options[j].text.trim()) {
                    toast.error(`Question ${i + 1}, Option ${j + 1} is empty`);
                    return;
                }
            }
        }

        setSaving(true);

        try {
            // First, delete all existing questions
            if (quiz?.questions && quiz.questions.length > 0) {
                await Promise.all(
                    quiz.questions.map(q =>
                        fetch(`/api/quiz/questions?id=${q.id}`, { method: 'DELETE' })
                    )
                );
            }

            // Then create new questions
            const res = await fetch('/api/quiz/questions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    quizId: resolvedParams.id,
                    questions
                })
            });

            if (res.ok) {
                toast.success('Questions saved successfully');
                router.push('/admin/quizzes');
            } else {
                toast.error('Failed to save questions');
            }
        } catch (error) {
            toast.error('Failed to save questions');
        } finally {
            setSaving(false);
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
        <div className="space-y-6 max-w-5xl pb-20">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin/quizzes">
                        <Button variant="outline" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{quiz?.title}</h1>
                        <p className="text-muted-foreground mt-1">
                            {questions.length} question{questions.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <label htmlFor="excel-import">
                        <Button
                            type="button"
                            variant="outline"
                            className="gap-2"
                            disabled={importingExcel}
                            onClick={() => document.getElementById('excel-import')?.click()}
                        >
                            <FileSpreadsheet className="h-4 w-4" />
                            {importingExcel ? 'Importing...' : 'Import Excel'}
                        </Button>
                        <input
                            id="excel-import"
                            type="file"
                            accept=".xlsx,.xls"
                            onChange={handleExcelImport}
                            className="hidden"
                        />
                    </label>

                    <Button onClick={addQuestion} variant="outline" className="gap-2">
                        <Plus className="h-4 w-4" />
                        Add Question
                    </Button>

                    <Button onClick={saveQuestions} disabled={saving} className="gap-2">
                        <Save className="h-4 w-4" />
                        {saving ? 'Saving...' : 'Save All'}
                    </Button>
                </div>
            </div>

            {questions.length === 0 ? (
                <Card className="elevated">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <h3 className="text-xl font-semibold mb-2">No Questions Yet</h3>
                        <p className="text-muted-foreground mb-6">
                            Add questions manually or import from Excel
                        </p>
                        <div className="flex gap-3">
                            <Button onClick={addQuestion} className="gap-2">
                                <Plus className="h-4 w-4" />
                                Add First Question
                            </Button>
                            <label htmlFor="excel-import-empty">
                                <Button variant="outline" className="gap-2">
                                    <FileSpreadsheet className="h-4 w-4" />
                                    Import from Excel
                                </Button>
                                <input
                                    id="excel-import-empty"
                                    type="file"
                                    accept=".xlsx,.xls"
                                    onChange={handleExcelImport}
                                    className="hidden"
                                />
                            </label>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {questions.map((question, qIndex) => (
                        <Card key={qIndex} className="elevated">
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between gap-4">
                                    <CardTitle className="text-lg">Question {qIndex + 1}</CardTitle>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                        onClick={() => removeQuestion(qIndex)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Question Text *</Label>
                                    <Textarea
                                        value={question.text}
                                        onChange={(e) => updateQuestion(qIndex, 'text', e.target.value)}
                                        placeholder="Enter your question"
                                        rows={3}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Question Image (Optional)</Label>
                                    <div className="flex gap-2">
                                        {question.imageUrl && (
                                            <div className="relative">
                                                <img
                                                    src={question.imageUrl}
                                                    alt="Question"
                                                    className="w-32 h-32 object-cover rounded border"
                                                />
                                                <Button
                                                    variant="destructive"
                                                    size="icon"
                                                    className="absolute -top-2 -right-2 h-6 w-6"
                                                    onClick={() => updateQuestion(qIndex, 'imageUrl', null)}
                                                >
                                                    <X className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        )}
                                        <label htmlFor={`q-img-${qIndex}`}>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="gap-2"
                                                onClick={() => document.getElementById(`q-img-${qIndex}`)?.click()}
                                            >
                                                <ImageIcon className="h-3 w-3" />
                                                Upload Image
                                            </Button>
                                            <input
                                                id={`q-img-${qIndex}`}
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) handleImageUpload(file, qIndex);
                                                    e.target.value = '';
                                                }}
                                                className="hidden"
                                            />
                                        </label>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Points</Label>
                                        <Input
                                            type="number"
                                            min="1"
                                            value={question.points}
                                            onChange={(e) => updateQuestion(qIndex, 'points', parseInt(e.target.value) || 1)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Type</Label>
                                        <select
                                            value={question.questionType}
                                            onChange={(e) => updateQuestion(qIndex, 'questionType', e.target.value)}
                                            className="w-full px-3 py-2 border rounded-md"
                                        >
                                            <option value="SINGLE">Single Choice</option>
                                            <option value="MULTIPLE">Multiple Choice</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-3 pt-2">
                                    <div className="flex items-center justify-between">
                                        <Label>Options *</Label>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => addOption(qIndex)}
                                            className="gap-1"
                                        >
                                            <Plus className="h-3 w-3" />
                                            Add Option
                                        </Button>
                                    </div>

                                    {question.options.map((option, oIndex) => (
                                        <div key={oIndex} className="flex gap-2 items-start">
                                            <div className="flex items-center pt-2">
                                                <input
                                                    type={question.questionType === 'SINGLE' ? 'radio' : 'checkbox'}
                                                    name={`correct-${qIndex}`}
                                                    checked={option.isCorrect}
                                                    onChange={(e) => {
                                                        if (question.questionType === 'SINGLE') {
                                                            // For single choice, uncheck all others
                                                            const updated = [...questions];
                                                            updated[qIndex].options.forEach((opt, idx) => {
                                                                opt.isCorrect = idx === oIndex;
                                                            });
                                                            setQuestions(updated);
                                                        } else {
                                                            updateOption(qIndex, oIndex, 'isCorrect', e.target.checked);
                                                        }
                                                    }}
                                                    className="mr-2"
                                                />
                                            </div>
                                            <Input
                                                value={option.text}
                                                onChange={(e) => updateOption(qIndex, oIndex, 'text', e.target.value)}
                                                placeholder={`Option ${oIndex + 1}`}
                                                className="flex-1"
                                            />
                                            {question.options.length > 2 && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => removeOption(qIndex, oIndex)}
                                                    className="text-red-600"
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <div className="space-y-2">
                                    <Label>Explanation (Optional)</Label>
                                    <Textarea
                                        value={question.explanation || ''}
                                        onChange={(e) => updateQuestion(qIndex, 'explanation', e.target.value)}
                                        placeholder="Explain the correct answer"
                                        rows={2}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
