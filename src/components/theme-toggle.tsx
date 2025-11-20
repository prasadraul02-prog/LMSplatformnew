'use client';

import { useTheme } from './theme-provider';

export default function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            style={{
                background: 'none',
                border: '1px solid var(--border)',
                padding: '0.5rem',
                borderRadius: 'var(--radius)',
                color: 'var(--text)',
                cursor: 'pointer'
            }}
            aria-label="Toggle Dark Mode"
        >
            {theme === 'light' ? '🌙' : '☀️'}
        </button>
    );
}
