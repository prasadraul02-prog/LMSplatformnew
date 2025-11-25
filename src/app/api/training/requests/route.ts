import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { sendApprovalEmail } from '@/lib/email';
import { generateToken, getBaseUrl } from '@/lib/training-utils';

const prisma = new PrismaClient();

// POST: Send training approval requests to Workshop Managers
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { batchId, locations } = body;

        if (!batchId) {
            return NextResponse.json(
                { error: 'Batch ID is required' },
                { status: 400 }
            );
        }

        const baseUrl = getBaseUrl();
        let totalSent = 0;
        const errors: string[] = [];

        // Get untrained employees for the batch
        const where: any = {
            uploadBatchId: batchId,
            trainingLevel: 'UNTRAINED',
        };

        if (locations && locations.length > 0) {
            where.location = { in: locations };
        }

        const untrainedEmployees = await prisma.employee.findMany({ where });

        // Group by location
        const employeesByLocation: Record<string, any[]> = {};
        untrainedEmployees.forEach((emp) => {
            if (!employeesByLocation[emp.location]) {
                employeesByLocation[emp.location] = [];
            }
            employeesByLocation[emp.location].push(emp);
        });

        // Send emails for each location
        for (const [location, employees] of Object.entries(employeesByLocation)) {
            // Find Workshop Manager(s) for this location
            const workshopManagers = await prisma.workshopManager.findMany({
                where: {
                    location,
                    isActive: true,
                },
            });

            if (workshopManagers.length === 0) {
                errors.push(`No active Workshop Manager found for location: ${location}`);
                continue;
            }

            // Use the first active WM for this location
            const wm = workshopManagers[0];

            // Create training requests and generate tokens
            const employeeApprovalData = await Promise.all(
                employees.map(async (emp) => {
                    const approveToken = generateToken();
                    const rejectToken = generateToken();

                    // Create training request
                    await prisma.trainingRequest.create({
                        data: {
                            employeeId: emp.id,
                            originalLocation: emp.location,
                            trainingLocation: emp.location,
                            wmId: wm.id,
                            status: 'SENT',
                            approveToken,
                            rejectToken,
                            batchId,
                            requestSentAt: new Date(),
                        },
                    });

                    return {
                        employeeId: emp.employeeId,
                        name: emp.name,
                        department: emp.department,
                        designation: emp.designation,
                        location: emp.location,
                        email: emp.email,
                        phone: emp.phone,
                        trainingLevel: emp.trainingLevel,
                        approveToken,
                        rejectToken,
                    };
                })
            );

            // Send email to Workshop Manager
            const emailSent = await sendApprovalEmail({
                wmEmail: wm.email,
                wmName: wm.name,
                location,
                employees: employeeApprovalData,
                baseUrl,
            });

            if (emailSent) {
                totalSent += employees.length;
            } else {
                errors.push(`Failed to send email to ${wm.email} for location: ${location}`);
            }
        }

        return NextResponse.json({
            success: true,
            totalSent,
            locationsProcessed: Object.keys(employeesByLocation).length,
            errors: errors.length > 0 ? errors : null,
        });
    } catch (error: any) {
        console.error('Error sending training requests:', error);
        return NextResponse.json(
            { error: 'Failed to send training requests', details: error.message },
            { status: 500 }
        );
    }
}

// GET: Fetch training requests with status
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const batchId = searchParams.get('batchId');
        const status = searchParams.get('status');
        const location = searchParams.get('location');

        const where: any = {};
        if (batchId) where.batchId = batchId;
        if (status) where.status = status;
        if (location) where.trainingLocation = location;

        const requests = await prisma.trainingRequest.findMany({
            where,
            include: {
                employee: true,
                workshopManager: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({ requests });
    } catch (error: any) {
        console.error('Error fetching training requests:', error);
        return NextResponse.json(
            { error: 'Failed to fetch training requests', details: error.message },
            { status: 500 }
        );
    }
}
