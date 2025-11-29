import { getAvatarUrl } from './avatar-options';

// Generate avatar URL based on user's selected avatar or default
export function generateAvatarUrl(userId: string, selectedAvatar?: string | null): string {
    return getAvatarUrl(userId, selectedAvatar);
}

export function getAvatarFallback(name: string | null | undefined, email: string): string {
    if (name) {
        return name.charAt(0).toUpperCase();
    }
    return email.charAt(0).toUpperCase();
}
