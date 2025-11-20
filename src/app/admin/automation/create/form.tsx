'use client';

import { useFormState } from 'react-dom';
import { createTrainingRule, State } from '../actions';
import { useEffect, useState } from 'react';

export default function CreateRuleForm({ departments, designations, courses }: { departments: any[], designations: any[], courses: any[] }) {
    const initialState: State = { message: null, error: {} };
    const [state, formAction] = useFormState(createTrainingRule, initialState);

    return (
        <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '500px' }}>
            <div>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Rule Name</label>
                <input type="text" name="name" className="input" required placeholder="e.g. Onboarding for Sales" />
            </div>

            <div>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Department (Optional)</label>
                <select name="departmentId" className="input">
                    <option value="">Any Department</option>
                    {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                </select>
            </div>

            <div>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Designation (Optional)</label>
                <select name="designationId" className="input">
                    <option value="">Any Designation</option>
                    {designations.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                </select>
            </div>

            <div>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Assign Course</label>
                <select name="courseId" className="input" required>
                    <option value="">Select Course</option>
                    {courses.map(c => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                </select>
            </div>

            <button type="submit" className="btn btn-primary">Create Rule & Auto-Assign</button>

            {state?.success && <p style={{ color: 'green' }}>{state.message}</p>}
            {state?.message && !state.success && <p style={{ color: 'red' }}>{state.message}</p>}
        </form>
    );
}
