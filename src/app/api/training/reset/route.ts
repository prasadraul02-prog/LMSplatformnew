import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST() {
    try {
        // Delete all training requests first (due to foreign key constraints)
        await prisma.trainingRequest.deleteMany({});

        // Delete all employees
        await prisma.employee.deleteMany({});

        return NextResponse.json({
            success: true,
            message: 'All training data has been reset successfully',
        });
    } catch (error: any) {
        console.error('Error resetting data:', error);
        return NextResponse.json(
            { error: 'Failed to reset data', details: error.message },
            { status: 500 }
        );
    }
}
