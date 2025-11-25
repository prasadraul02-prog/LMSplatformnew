import crypto from 'crypto';

/**
 * Generate a secure random token for approval/rejection actions
 */
export const generateToken = (): string => {
    return crypto.randomBytes(32).toString('hex');
};

/**
 * Generate a unique batch ID for employee uploads
 */
export const generateBatchId = (): string => {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `BATCH_${timestamp}_${randomStr}`.toUpperCase();
};

/**
 * Parse training level to standardized format
 */
export const parseTrainingLevel = (level: string): string => {
    const normalized = level.trim().toUpperCase();

    const mapping: Record<string, string> = {
        'UNTRAINED': 'UNTRAINED',
        'BASIC': 'BASIC',
        'ADVANCE': 'ADVANCE',
        'ADVANCED': 'ADVANCE',
        'EXPERT': 'EXPERT',
    };

    return mapping[normalized] || 'UNTRAINED';
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Get base URL from environment
 */
export const getBaseUrl = (): string => {
    if (process.env.NEXT_PUBLIC_BASE_URL) {
        return process.env.NEXT_PUBLIC_BASE_URL;
    }

    if (process.env.VERCEL_URL) {
        return `https://${process.env.VERCEL_URL}`;
    }

    return 'http://localhost:3000';
};
