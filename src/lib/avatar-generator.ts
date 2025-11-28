// Generate deterministic cartoon animal avatars based on user ID/email
export function generateAvatarUrl(userId: string): string {
    const animals = [
        'cat', 'dog', 'fox', 'panda', 'koala', 'lion', 'tiger', 'bear',
        'rabbit', 'hamster', 'mouse', 'squirrel', 'owl', 'penguin', 'duck',
        'elephant', 'giraffe', 'hippo', 'rhino', 'zebra', 'monkey', 'gorilla'
    ];

    // Create a simple hash from the userId
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
        hash = ((hash << 5) - hash) + userId.charCodeAt(i);
        hash = hash & hash; // Convert to 32bit integer
    }

    // Use absolute value and modulo to get a consistent index
    const index = Math.abs(hash) % animals.length;
    const animal = animals[index];

    // Use DiceBear API for consistent, cute cartoon animals
    // This generates the same avatar for the same userId every time
    return `https://api.dicebear.com/7.x/bottts/svg?seed=${userId}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
}

export function getAvatarFallback(name: string | null | undefined, email: string): string {
    if (name) {
        return name.charAt(0).toUpperCase();
    }
    return email.charAt(0).toUpperCase();
}
