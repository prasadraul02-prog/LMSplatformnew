'use client';

import { useFormState } from 'react-dom';
import { addQuestion } from './actions';
import { useState } from 'react';

export default function AddQuestionForm({ moduleId }: { moduleId: string }) {
    const addQuestionWithId = addQuestion.bind(null, moduleId);
    const initialState = { message: null, error: null };
    const [state, formAction] = useFormState(addQuestionWithId, initialState);

    const [options, setOptions] = useState([
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
    ]);

    const handleOptionChange = (index: number, field: string, value: any) => {
        const newOptions = [...options];
        newOptions[index] = { ...newOptions[index], [field]: value };
        setOptions(newOptions);
    };

    const addOption = () => {
        setOptions([...options, { text: '', isCorrect: false }]);
    };

    return (
        <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Question Text</label>
                <input type="text" name="text" className="input" required />
            </div>

            <div>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Type</label>
                <select name="type" className="input">
                    <option value="MCQ">Multiple Choice</option>
                    <option value="TRUE_FALSE">True/False</option>
                </select>
            </div>

            <div>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Options</label>
                {options.map((opt, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <input
                            type="text"
                            placeholder={`Option ${idx + 1}`}
                            className="input"
                            value={opt.text}
                            onChange={(e) => handleOptionChange(idx, 'text', e.target.value)}
                            required
                        />
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <input
                                type="checkbox"
                                checked={opt.isCorrect}
                                onChange={(e) => handleOptionChange(idx, 'isCorrect', e.target.checked)}
                            />
                            Correct
                        </label>
                    </div>
                ))}
                <button type="button" onClick={addOption} className="btn" style={{ fontSize: '0.875rem' }}>+ Add Option</button>
                <input type="hidden" name="options" value={JSON.stringify(options)} />
            </div>

            <div>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Explanation (Optional)</label>
                <textarea name="explanation" className="input" rows={2} />
            </div>

            <button type="submit" className="btn btn-primary">Save Question</button>

            {state?.success && <p style={{ color: 'green' }}>{state.message}</p>}
            {state?.message && !state.success && <p style={{ color: 'red' }}>{state.message}</p>}
        </form>
    );
}
