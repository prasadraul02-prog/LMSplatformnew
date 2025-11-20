'use client';

import { useState, useEffect } from 'react';
import { submitQuiz } from './actions';
import { useRouter } from 'next/navigation';
import styles from './quiz.module.css';

export default function QuizTaker({ quiz, courseId, moduleId }: { quiz: any, courseId: string, moduleId: string }) {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [timeLeft, setTimeLeft] = useState((quiz.timeLimit || 30) * 60);
    const [submitted, setSubmitted] = useState(false);
    const [result, setResult] = useState<any>(null);
    const router = useRouter();

    const currentQuestion = quiz.questions[currentQuestionIndex];
    const options = currentQuestion.options as any[];

    useEffect(() => {
        if (submitted) return;
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    handleSubmit();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [submitted]);

    const handleOptionSelect = (optionText: string) => {
        setAnswers({ ...answers, [currentQuestion.id]: optionText });
    };

    const handleNext = () => {
        if (currentQuestionIndex < quiz.questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        }
    };

    const handlePrev = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(currentQuestionIndex - 1);
        }
    };

    const handleSubmit = async () => {
        setSubmitted(true);
        const res = await submitQuiz(courseId, moduleId, answers);
        setResult(res);
    };

    if (result) {
        return (
            <div className={styles.container}>
                <div className={styles.card}>
                    <h1>Quiz Result</h1>
                    <div className={styles.score}>
                        {result.score}%
                    </div>
                    <p className={result.passed ? styles.passed : styles.failed}>
                        {result.passed ? 'PASSED' : 'FAILED'}
                    </p>
                    <button onClick={() => router.push(`/employee/courses/${courseId}`)} className="btn btn-primary">
                        Back to Course
                    </button>
                </div>
            </div>
        );
    }

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>Question {currentQuestionIndex + 1} / {quiz.questions.length}</div>
                <div className={styles.timer}>Time Left: {formatTime(timeLeft)}</div>
            </div>

            <div className={styles.card}>
                <h2 className={styles.question}>{currentQuestion.text}</h2>
                <div className={styles.options}>
                    {options.map((opt, idx) => (
                        <button
                            key={idx}
                            className={`${styles.option} ${answers[currentQuestion.id] === opt.text ? styles.selected : ''}`}
                            onClick={() => handleOptionSelect(opt.text)}
                        >
                            {opt.text}
                        </button>
                    ))}
                </div>
            </div>

            <div className={styles.footer}>
                <button onClick={handlePrev} disabled={currentQuestionIndex === 0} className="btn">
                    Previous
                </button>
                {currentQuestionIndex === quiz.questions.length - 1 ? (
                    <button onClick={handleSubmit} className="btn btn-primary">
                        Submit Quiz
                    </button>
                ) : (
                    <button onClick={handleNext} className="btn btn-primary">
                        Next
                    </button>
                )}
            </div>
        </div>
    );
}
