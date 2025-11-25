import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
    request: NextRequest,
    { params }: { params: { requestId: string } }
) {
    try {
        const { requestId } = params;

        // Get all requests for this batch/location
        const requests = await prisma.trainingRequest.findMany({
            where: {
                OR: [
                    { approveToken: requestId },
                    { rejectToken: requestId },
                ],
            },
            include: {
                employee: true,
                workshopManager: true,
            },
            take: 1,
        });

        if (requests.length === 0) {
            return NextResponse.json(
                { error: 'Request not found' },
                { status: 404 }
            );
        }

        const firstRequest = requests[0];

        if (!firstRequest.workshopManager) {
            return NextResponse.json(
                { error: 'Workshop Manager not found' },
                { status: 404 }
            );
        }

        // Get all pending requests for the same location and WM
        const allRequests = await prisma.trainingRequest.findMany({
            where: {
                wmId: firstRequest.wmId,
                status: 'SENT',
            },
            include: {
                employee: true,
            },
            orderBy: {
                createdAt: 'asc',
            },
        });

        return NextResponse.json({
            success: true,
            wmName: firstRequest.workshopManager.name,
            location: firstRequest.workshopManager.location,
            requests: allRequests.map(req => ({
                id: req.id,
                employeeId: req.employee.employeeId,
                name: req.employee.name,
                department: req.employee.department,
                designation: req.employee.designation,
                location: req.employee.location,
                email: req.employee.email,
                phone: req.employee.phone,
                approveToken: req.approveToken,
                rejectToken: req.rejectToken,
            })),
        });
    } catch (error: any) {
        console.error('Error fetching requests:', error);
        return NextResponse.json(
            { error: 'Failed to fetch requests', details: error.message },
            { status: 500 }
        );
    }
}
