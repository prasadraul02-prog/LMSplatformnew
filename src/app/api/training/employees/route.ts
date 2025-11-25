import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import { generateBatchId, parseTrainingLevel } from '@/lib/training-utils';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json(
                { error: 'No file uploaded' },
                { status: 400 }
            );
        }

        // Read Excel file
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) {
            return NextResponse.json(
                { error: 'Excel file is empty' },
                { status: 400 }
            );
        }

        // Generate batch ID
        const batchId = generateBatchId();

        // Parse and store employees
        const employees: any[] = [];
        const errors: string[] = [];

        for (let i = 0; i < jsonData.length; i++) {
            const row: any = jsonData[i];

            // Validate required fields (flexible column names)
            const employeeId = row['Employee ID'] || row['EmployeeID'] || row['ID'] || row['employee_id'];
            const name = row['Name'] || row['Employee Name'] || row['name'];
            const location = row['Location'] || row['location'];
            const trainingLevel = row['Training Level'] || row['Training Levels'] || row['TrainingLevel'] || row['Level'];

            if (!employeeId || !name || !location || !trainingLevel) {
                errors.push(`Row ${i + 2}: Missing required fields (Employee ID, Name, Location, or Training Level)`);
                continue;
            }

            // Extract additional fields
            const department = row['Department'] || row['department'] || null;
            const designation = row['Designation'] || row['designation'] || null;
            const email = row['Email'] || row['email'] || null;
            const phone = row['Phone'] || row['phone'] || row['Contact'] || null;
            const region = row['Region'] || row['region'] || null;

            // Store additional data as JSON
            const additionalData = JSON.stringify({
                ...row,
                __rowNumber: i + 2
            });

            employees.push({
                employeeId: String(employeeId),
                name: String(name),
                location: String(location),
                trainingLevel: parseTrainingLevel(String(trainingLevel)),
                department: department ? String(department) : null,
                designation: designation ? String(designation) : null,
                email: email ? String(email) : null,
                phone: phone ? String(phone) : null,
                region: region ? String(region) : null,
                additionalData,
                uploadBatchId: batchId,
            });
        }

        // Bulk insert employees (upsert to handle duplicates)
        const results = await Promise.allSettled(
            employees.map((emp) =>
                prisma.employee.upsert({
                    where: { employeeId: emp.employeeId },
                    update: emp,
                    create: emp,
                })
            )
        );

        // Count successful inserts
        const successCount = results.filter((r) => r.status === 'fulfilled').length;
        const failedCount = results.filter((r) => r.status === 'rejected').length;

        // Get untrained employees summary
        const untrainedEmployees = await prisma.employee.findMany({
            where: {
                uploadBatchId: batchId,
                trainingLevel: 'UNTRAINED',
            },
            select: {
                location: true,
            },
        });

        // Group by location
        const locationSummary: Record<string, number> = {};
        untrainedEmployees.forEach((emp) => {
            locationSummary[emp.location] = (locationSummary[emp.location] || 0) + 1;
        });

        const summaryByLocation = Object.entries(locationSummary).map(([location, count]) => ({
            location,
            count,
        }));

        return NextResponse.json({
            success: true,
            batchId,
            totalProcessed: jsonData.length,
            successCount,
            failedCount,
            errors: errors.length > 0 ? errors : null,
            untrainedCount: untrainedEmployees.length,
            summaryByLocation,
        });
    } catch (error: any) {
        console.error('Error uploading employees:', error);
        return NextResponse.json(
            { error: 'Failed to process Excel file', details: error.message },
            { status: 500 }
        );
    }
}

// GET untrained employees
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const location = searchParams.get('location');
        const batchId = searchParams.get('batchId');

        const where: any = { trainingLevel: 'UNTRAINED' };
        if (location) where.location = location;
        if (batchId) where.uploadBatchId = batchId;

        const employees = await prisma.employee.findMany({
            where,
            orderBy: { location: 'asc' },
        });

        return NextResponse.json({ employees });
    } catch (error: any) {
        console.error('Error fetching untrained employees:', error);
        return NextResponse.json(
            { error: 'Failed to fetch employees', details: error.message },
            { status: 500 }
        );
    }
}
