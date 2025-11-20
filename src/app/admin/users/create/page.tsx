'use client';

import { useFormState } from 'react-dom';
import { createUser } from '../actions';
import styles from '../../admin.module.css'; // Reuse admin styles or create specific

export default function CreateUserPage() {
    const initialState = { message: null, error: null };
    const [state, formAction] = useFormState(createUser, initialState);

    return (
        <div style={{ maxWidth: '600px' }}>
            <h1 style={{ marginBottom: '2rem' }}>Create New User</h1>

            <div className="card">
                <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label htmlFor="name" style={{ display: 'block', marginBottom: '0.5rem' }}>Name</label>
                        <input type="text" id="name" name="name" className="input" required />
                        {state?.error?.name && <p style={{ color: 'red' }}>{state.error.name}</p>}
                    </div>

                    <div>
                        <label htmlFor="email" style={{ display: 'block', marginBottom: '0.5rem' }}>Email</label>
                        <input type="email" id="email" name="email" className="input" required />
                        {state?.error?.email && <p style={{ color: 'red' }}>{state.error.email}</p>}
                        {state?.message && !state.success && <p style={{ color: 'red' }}>{state.message}</p>}
                    </div>

                    <div>
                        <label htmlFor="password" style={{ display: 'block', marginBottom: '0.5rem' }}>Password</label>
                        <input type="password" id="password" name="password" className="input" required />
                        {state?.error?.password && <p style={{ color: 'red' }}>{state.error.password}</p>}
                    </div>

                    <div>
                        <label htmlFor="role" style={{ display: 'block', marginBottom: '0.5rem' }}>Role</label>
                        <select id="role" name="role" className="input">
                            <option value="EMPLOYEE">Employee</option>
                            <option value="TRAINER">Trainer</option>
                            <option value="ADMIN">Admin</option>
                        </select>
                    </div>

                    <button type="submit" className="btn btn-primary">Create User</button>

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
