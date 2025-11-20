'use client';

import { useFormState } from 'react-dom';
import { createModule } from '../../actions';
import styles from '../../../admin.module.css';

export default function CreateModulePage({ params }: { params: { id: string } }) {
    const createModuleWithId = createModule.bind(null, params.id);
    const initialState = { message: null, error: null };
    const [state, formAction] = useFormState(createModuleWithId, initialState);

    return (
        <div style={{ maxWidth: '600px' }}>
            <h1 style={{ marginBottom: '2rem' }}>Add Module</h1>

            <div className="card">
                <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label htmlFor="title" style={{ display: 'block', marginBottom: '0.5rem' }}>Title</label>
                        <input type="text" id="title" name="title" className="input" required />
                        {state?.error?.title && <p style={{ color: 'red' }}>{state.error.title}</p>}
                    </div>

                    <div>
                        <label htmlFor="type" style={{ display: 'block', marginBottom: '0.5rem' }}>Type</label>
                        <select id="type" name="type" className="input">
                            <option value="VIDEO">Video</option>
                            <option value="PDF">PDF</option>
                            <option value="PPT">PPT</option>
                            <option value="QUIZ">Quiz</option>
                            <option value="ASSIGNMENT">Assignment</option>
                        </select>
                    </div>

                    <div>
                        <label htmlFor="contentUrl" style={{ display: 'block', marginBottom: '0.5rem' }}>Content URL / File Path</label>
                        <input type="text" id="contentUrl" name="contentUrl" className="input" placeholder="https://..." />
                    </div>

                    <div>
                        <label htmlFor="description" style={{ display: 'block', marginBottom: '0.5rem' }}>Description</label>
                        <textarea id="description" name="description" className="input" rows={3} />
                    </div>

                    <div>
                        <label htmlFor="order" style={{ display: 'block', marginBottom: '0.5rem' }}>Order</label>
                        <input type="number" id="order" name="order" className="input" defaultValue={1} required />
                    </div>

                    <button type="submit" className="btn btn-primary">Add Module</button>

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
