import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { join } from 'path';

// Configuration
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

export async function POST(request: NextRequest) {
    let tempFilePath: string | null = null;

    try {
        // Authentication check
        const session = await auth();

        if (!session?.user || session.user.role !== 'ADMIN') {
            console.warn('Unauthorized upload attempt');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Parse form data
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            console.error('Upload failed: No file provided');
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            console.error(`Upload failed: File too large (${file.size} bytes)`);
            return NextResponse.json(
                { error: `File size exceeds maximum limit of ${MAX_FILE_SIZE / 1024 / 1024}MB` },
                { status: 400 }
            );
        }

        if (file.size === 0) {
            console.error('Upload failed: Empty file');
            return NextResponse.json({ error: 'File is empty' }, { status: 400 });
        }

        // Validate MIME type
        if (!ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
            console.error(`Upload failed: Invalid MIME type (${file.type})`);
            return NextResponse.json(
                { error: `File must be an image (${ALLOWED_EXTENSIONS.join(', ')})` },
                { status: 400 }
            );
        }

        // Validate file extension
        const extension = file.name.split('.').pop()?.toLowerCase();
        if (!extension || !ALLOWED_EXTENSIONS.includes(extension)) {
            console.error(`Upload failed: Invalid extension (${extension})`);
            return NextResponse.json(
                { error: `Invalid file extension. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}` },
                { status: 400 }
            );
        }

        // Create upload directory with robust path resolution
        // Try multiple path strategies to handle different deployment environments
        let uploadDir: string;
        let publicDir: string;

        // Strategy 1: Standard Next.js public directory
        publicDir = join(process.cwd(), 'public');

        // Strategy 2: If public doesn't exist at cwd, try parent directory (for some deployment scenarios)
        const fs = await import('fs');
        if (!fs.existsSync(publicDir)) {
            const parentPublic = join(process.cwd(), '..', 'public');
            if (fs.existsSync(parentPublic)) {
                publicDir = parentPublic;
            } else {
                // Strategy 3: Use absolute path if available from environment
                if (process.env.PUBLIC_DIR) {
                    publicDir = process.env.PUBLIC_DIR;
                } else {
                    console.error('Public directory not found at:', publicDir);
                    console.error('Current working directory:', process.cwd());
                    return NextResponse.json(
                        {
                            error: 'Upload directory not configured',
                            details: 'Public directory not found. Please contact administrator.'
                        },
                        { status: 500 }
                    );
                }
            }
        }

        uploadDir = join(publicDir, 'quiz-images');
        console.log('Upload directory path:', uploadDir);

        try {
            await mkdir(uploadDir, { recursive: true });
            console.log('Upload directory ready:', uploadDir);
        } catch (mkdirError) {
            console.error('Failed to create upload directory:', mkdirError);
            return NextResponse.json(
                {
                    error: 'Failed to create upload directory',
                    details: mkdirError instanceof Error ? mkdirError.message : 'Unknown error'
                },
                { status: 500 }
            );
        }

        // Generate unique filename
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 15);
        const filename = `${timestamp}-${randomString}.${extension}`;
        const filepath = join(uploadDir, filename);
        tempFilePath = filepath;

        // Read file data
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Write file to disk
        await writeFile(filepath, buffer);
        console.log(`Image uploaded successfully: ${filename} (${file.size} bytes)`);

        // Clear temp file path since write succeeded
        tempFilePath = null;

        // Return public URL
        const publicUrl = `/quiz-images/${filename}`;

        return NextResponse.json(
            {
                url: publicUrl,
                filename: filename,
                size: file.size
            },
            { status: 200 }
        );
    } catch (error) {
        // Cleanup failed upload
        if (tempFilePath) {
            try {
                await unlink(tempFilePath);
                console.log(`Cleaned up failed upload: ${tempFilePath}`);
            } catch (cleanupError) {
                console.error('Failed to cleanup temp file:', cleanupError);
            }
        }

        // Log detailed error
        console.error('Error uploading image:', error);

        // Return user-friendly error message
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

        return NextResponse.json(
            {
                error: 'Failed to upload image',
                details: errorMessage
            },
            { status: 500 }
        );
    }
}
