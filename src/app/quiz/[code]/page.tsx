import QuizClient from './QuizClient';

export default async function Page({ params }: { params: { code: string } }) {
    // In Next.js 15 params is a promise, in 14 it's an object.
    // Awaiting it works in both cases (awaiting an object returns the object).
    // This is the most robust "permanent" fix.
    const { code } = await params;

    return <QuizClient code={code} />;
}
