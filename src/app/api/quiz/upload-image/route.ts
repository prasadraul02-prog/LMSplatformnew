import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

// Configuration
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

export async function POST(request: NextRequest) {
    try {
        // Authentication check
        const session = await auth();

        if (!session?.user || session.user.role !== 'ADMIN') {
            console.warn('Unauthorized upload attempt');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!supabaseAdmin) {
            console.error('Supabase Admin client not initialized');
            return NextResponse.json({ error: 'Storage service unavailable' }, { status: 500 });
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

        // Validate MIME type
        if (!ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
            console.error(`Upload failed: Invalid MIME type (${file.type})`);
            return NextResponse.json(
                { error: `File must be an image (${ALLOWED_EXTENSIONS.join(', ')})` },
                { status: 400 }
            );
        }

        // Generate unique filename
        const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 11);
        const filename = `${timestamp}-${randomString}.${extension}`;

        // Upload to Supabase Storage
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const { data, error: uploadError } = await supabaseAdmin.storage
            .from('quiz-images')
            .upload(filename, buffer, {
                contentType: file.type,
                upsert: false
            });

        if (uploadError) {
            console.error('Supabase storage upload error:', uploadError);
            return NextResponse.json(
                { error: 'Failed to upload to cloud storage', details: uploadError.message },
                { status: 500 }
            );
        }

        // Get Public URL
        const { data: { publicUrl } } = supabaseAdmin.storage
            .from('quiz-images')
            .getPublicUrl(filename);

        console.log(`Image uploaded to Supabase successfully: ${filename}`);

        return NextResponse.json(
            {
                url: publicUrl,
                filename: filename,
                size: file.size
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error uploading image:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        return NextResponse.json(
            { error: 'Failed to upload image', details: errorMessage },
            { status: 500 }
        );
    }
}
