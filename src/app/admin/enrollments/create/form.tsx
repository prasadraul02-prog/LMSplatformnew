'use client';

import { useFormState } from 'react-dom';
import { createEnrollment } from '../actions';

export default function EnrollmentForm({ users, courses }: { users: any[], courses: any[] }) {
    const initialState = { message: null, error: null };
    const [state, formAction] = useFormState(createEnrollment, initialState);

    return (
        <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
                <label htmlFor="userId" style={{ display: 'block', marginBottom: '0.5rem' }}>Select User</label>
                <select id="userId" name="userId" className="input" required>
                    <option value="">-- Select User --</option>
                    {users.map(user => (
                        <option key={user.id} value={user.id}>
                            {user.name} ({user.email})
                        </option>
                    ))}
                </select>
                {state?.error?.userId && <p style={{ color: 'red' }}>{state.error.userId}</p>}
            </div>

            <div>
                <label htmlFor="courseId" style={{ display: 'block', marginBottom: '0.5rem' }}>Select Course</label>
                <select id="courseId" name="courseId" className="input" required>
                    <option value="">-- Select Course --</option>
                    {courses.map(course => (
                        <option key={course.id} value={course.id}>
                            {course.title}
                        </option>
                    ))}
                </select>
                {state?.error?.courseId && <p style={{ color: 'red' }}>{state.error.courseId}</p>}
            </div>

            <button type="submit" className="btn btn-primary">Enroll</button>

            {state?.success && (
                <div style={{ color: 'green', marginTop: '1rem' }}>
                    {state.message}
                </div>
            )}
            {state?.message && !state.success && (
                <div style={{ color: 'red', marginTop: '1rem' }}>
                    {state.message}
                </div>
            )}
        </form>
    );
}
