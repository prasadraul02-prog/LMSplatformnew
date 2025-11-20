import Link from "next/link";

export default function Home() {
    return (
        <main style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            gap: '2rem',
            textAlign: 'center'
        }}>
            <h1 style={{ fontSize: '3rem', fontWeight: 'bold' }}>Welcome to LMS Portal</h1>
            <p style={{ fontSize: '1.25rem', color: 'var(--text-muted)' }}>
                Empowering learning and growth.
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
                <Link href="/login" className="btn btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.25rem' }}>
                    Login
                </Link>
            </div>
        </main>
    );
}
