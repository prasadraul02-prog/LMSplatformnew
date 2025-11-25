import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { sendApprovalEmail } from '@/lib/email';
import { generateToken, getBaseUrl } from '@/lib/training-utils';

const prisma = new PrismaClient();

// PUT: Update training location for a request
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { requestId, newLocation } = body;

        if (!requestId || !newLocation) {
            return NextResponse.json(
                { error: 'Request ID and new location are required' },
                { status: 400 }
            );
        }

        // Get current request
        const trainingRequest = await prisma.trainingRequest.findUnique({
            where: { id: requestId },
            include: { employee: true },
        });

        if (!trainingRequest) {
            return NextResponse.json(
                { error: 'Training request not found' },
                { status: 404 }
            );
        }

        // Check if already processed
        if (trainingRequest.status === 'APPROVED' || trainingRequest.status === 'REJECTED') {
            return NextResponse.json(
                { error: 'Cannot change location for processed request' },
                { status: 400 }
            );
        }

        // Find Workshop Manager for new location
        const workshopManager = await prisma.workshopManager.findFirst({
            where: {
                location: newLocation,
                isActive: true,
            },
        });

        if (!workshopManager) {
            return NextResponse.json(
                { error: `No active Workshop Manager found for location: ${newLocation}` },
                { status: 404 }
            );
        }

        // Generate new tokens
        const newApproveToken = generateToken();
        const newRejectToken = generateToken();

        // Update request
        const updatedRequest = await prisma.trainingRequest.update({
            where: { id: requestId },
            data: {
                trainingLocation: newLocation,
                wmId: workshopManager.id,
                approveToken: newApproveToken,
                rejectToken: newRejectToken,
                status: 'PENDING', // Reset to pending
                requestSentAt: null,
                respondedAt: null,
            },
            include: {
                employee: true,
                workshopManager: true,
            },
        });

        // Send new email to new WM
        const baseUrl = getBaseUrl();
        const emailSent = await sendApprovalEmail({
            wmEmail: workshopManager.email,
            wmName: workshopManager.name,
            location: newLocation,
            employees: [
                {
                    employeeId: trainingRequest.employee.employeeId,
                    name: trainingRequest.employee.name,
                    department: trainingRequest.employee.department,
                    designation: trainingRequest.employee.designation,
                    location: newLocation,
                    email: trainingRequest.employee.email,
                    phone: trainingRequest.employee.phone,
                    trainingLevel: trainingRequest.employee.trainingLevel,
                    approveToken: newApproveToken,
                    rejectToken: newRejectToken,
                },
            ],
            baseUrl,
        });

        if (emailSent) {
            // Update status to SENT
            await prisma.trainingRequest.update({
                where: { id: requestId },
                data: {
                    status: 'SENT',
                    requestSentAt: new Date(),
                },
            });
        }

        return NextResponse.json({
            success: true,
            message: 'Location updated and new approval request sent',
            request: updatedRequest,
            emailSent,
        });
    } catch (error: any) {
        console.error('Error updating location:', error);
        return NextResponse.json(
            { error: 'Failed to update location', details: error.message },
            { status: 500 }
        );
    }
}
