// 10 preset avatar options using different DiceBear styles
export const AVATAR_OPTIONS = [
    { id: 'bottts', name: 'Robot', style: 'bottts' },
    { id: 'avataaars', name: 'Cartoon', style: 'avataaars' },
    { id: 'adventurer', name: 'Adventurer', style: 'adventurer' },
    { id: 'big-smile', name: 'Big Smile', style: 'big-smile' },
    { id: 'fun-emoji', name: 'Fun Emoji', style: 'fun-emoji' },
    { id: 'lorelei', name: 'Lorelei', style: 'lorelei' },
    { id: 'micah', name: 'Micah', style: 'micah' },
    { id: 'miniavs', name: 'Mini Avatar', style: 'miniavs' },
    { id: 'personas', name: 'Personas', style: 'personas' },
    { id: 'pixel-art', name: 'Pixel Art', style: 'pixel-art' },
];

export function getAvatarUrl(userId: string, avatarStyle?: string | null): string {
    const style = avatarStyle || 'bottts'; // Default to bottts if no selection
    return `https://api.dicebear.com/7.x/${style}/svg?seed=${userId}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
}
