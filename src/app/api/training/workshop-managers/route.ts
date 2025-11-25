import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { isValidEmail } from '@/lib/training-utils';

const prisma = new PrismaClient();

// GET: Fetch all workshop managers or filter by location
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const location = searchParams.get('location');

        const where: any = {};
        if (location) where.location = location;

        const workshopManagers = await prisma.workshopManager.findMany({
            where,
            orderBy: { location: 'asc' },
        });

        return NextResponse.json({ workshopManagers });
    } catch (error: any) {
        console.error('Error fetching workshop managers:', error);
        return NextResponse.json(
            { error: 'Failed to fetch workshop managers', details: error.message },
            { status: 500 }
        );
    }
}

// POST: Create a new workshop manager
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, email, location } = body;

        if (!name || !email || !location) {
            return NextResponse.json(
                { error: 'Name, email, and location are required' },
                { status: 400 }
            );
        }

        if (!isValidEmail(email)) {
            return NextResponse.json(
                { error: 'Invalid email format' },
                { status: 400 }
            );
        }

        // Check if email already exists
        const existing = await prisma.workshopManager.findUnique({
            where: { email },
        });

        if (existing) {
            return NextResponse.json(
                { error: 'Workshop manager with this email already exists' },
                { status: 409 }
            );
        }

        const workshopManager = await prisma.workshopManager.create({
            data: { name, email, location, isActive: true },
        });

        return NextResponse.json({ workshopManager }, { status: 201 });
    } catch (error: any) {
        console.error('Error creating workshop manager:', error);
        return NextResponse.json(
            { error: 'Failed to create workshop manager', details: error.message },
            { status: 500 }
        );
    }
}

// PUT: Update workshop manager
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, name, email, location, isActive } = body;

        if (!id) {
            return NextResponse.json(
                { error: 'Workshop manager ID is required' },
                { status: 400 }
            );
        }

        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (email !== undefined) {
            if (!isValidEmail(email)) {
                return NextResponse.json(
                    { error: 'Invalid email format' },
                    { status: 400 }
                );
            }
            updateData.email = email;
        }
        if (location !== undefined) updateData.location = location;
        if (isActive !== undefined) updateData.isActive = isActive;

        const workshopManager = await prisma.workshopManager.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json({ workshopManager });
    } catch (error: any) {
        console.error('Error updating workshop manager:', error);
        return NextResponse.json(
            { error: 'Failed to update workshop manager', details: error.message },
            { status: 500 }
        );
    }
}

// DELETE: Delete workshop manager
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { error: 'Workshop manager ID is required' },
                { status: 400 }
            );
        }

        await prisma.workshopManager.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting workshop manager:', error);
        return NextResponse.json(
            { error: 'Failed to delete workshop manager', details: error.message },
            { status: 500 }
        );
    }
}
