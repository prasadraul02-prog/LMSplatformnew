// Animal avatar options
export const AVATAR_OPTIONS = [
    { id: 'dog', name: 'Dog', style: 'dog' },
    { id: 'cat', name: 'Cat', style: 'cat' },
    { id: 'horse', name: 'Horse', style: 'horse' },
    { id: 'rabbit', name: 'Rabbit', style: 'rabbit' },
    { id: 'mouse', name: 'Mouse', style: 'mouse' },
    { id: 'snake', name: 'Snake', style: 'snake' },
    { id: 'crocodile', name: 'Crocodile', style: 'crocodile' },
    { id: 'elephant', name: 'Elephant', style: 'elephant' },
    { id: 'eagle', name: 'Eagle', style: 'eagle' },
    { id: 'lion', name: 'Lion', style: 'lion' },
    { id: 'cheetah', name: 'Cheetah', style: 'cheetah' },
    { id: 'donkey', name: 'Donkey', style: 'donkey' },
    { id: 'hamster', name: 'Hamster', style: 'hamster' },
    { id: 'buffalo', name: 'Buffalo', style: 'buffalo' },
    { id: 'cow', name: 'Cow', style: 'cow' },
];

const ANIMAL_EMOJIS: Record<string, string> = {
    dog: '🐶',
    cat: '🐱',
    horse: '🐴',
    rabbit: '🐰',
    mouse: '🐭',
    snake: '🐍',
    crocodile: '🐊',
    elephant: '🐘',
    eagle: '🦅',
    lion: '🦁',
    cheetah: '🐆',
    donkey: '🫏',
    hamster: '🐹',
    buffalo: '🐃',
    cow: '🐮',
};

export function getAvatarUrl(userId: string, avatarStyle?: string | null): string {
    const style = avatarStyle || 'dog'; // Default to dog if no selection

    if (ANIMAL_EMOJIS[style]) {
        const emoji = ANIMAL_EMOJIS[style];
        // Create a simple SVG with the emoji
        const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
            <rect width="100" height="100" fill="#f0f9ff" rx="50" />
            <text x="50" y="50" font-size="60" text-anchor="middle" dominant-baseline="central">${emoji}</text>
        </svg>
        `.trim();

        // Use URI encoding instead of base64 to avoid btoa() Latin1 character issues with emojis
        const encodedSvg = encodeURIComponent(svg);
        return `data:image/svg+xml,${encodedSvg}`;
    }

    // Fallback for any legacy styles or invalid options
    return `https://api.dicebear.com/7.x/${style}/svg?seed=${userId}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
}
