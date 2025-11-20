'use client';

import { useFormState } from 'react-dom';
import { createCourse } from '../actions';
import styles from '../../admin.module.css';

export default function CreateCoursePage() {
    const initialState = { message: null, error: null };
    const [state, formAction] = useFormState(createCourse, initialState);

    return (
        <div style={{ maxWidth: '600px' }}>
            <h1 style={{ marginBottom: '2rem' }}>Create New Course</h1>

            <div className="card">
                <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label htmlFor="title" style={{ display: 'block', marginBottom: '0.5rem' }}>Title</label>
                        <input type="text" id="title" name="title" className="input" required />
                        {state?.error?.title && <p style={{ color: 'red' }}>{state.error.title}</p>}
                    </div>

                    <div>
                        <label htmlFor="description" style={{ display: 'block', marginBottom: '0.5rem' }}>Description</label>
                        <textarea id="description" name="description" className="input" rows={4} required />
                        {state?.error?.description && <p style={{ color: 'red' }}>{state.error.description}</p>}
                    </div>

                    <div>
                        <label htmlFor="category" style={{ display: 'block', marginBottom: '0.5rem' }}>Category</label>
                        <input type="text" id="category" name="category" className="input" required />
                        {state?.error?.category && <p style={{ color: 'red' }}>{state.error.category}</p>}
                    </div>

                    <div>
                        <label htmlFor="level" style={{ display: 'block', marginBottom: '0.5rem' }}>Level</label>
                        <select id="level" name="level" className="input">
                            <option value="BASIC">Basic</option>
                            <option value="INTERMEDIATE">Intermediate</option>
                            <option value="ADVANCED">Advanced</option>
                            <option value="EXPERT">Expert</option>
                        </select>
                    </div>

                    <button type="submit" className="btn btn-primary">Create Course</button>

                    {state?.success && (
                        <div style={{ color: 'green', marginTop: '1rem' }}>
                            {state.message}
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}
