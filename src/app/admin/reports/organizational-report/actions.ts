'use server'

import { prisma } from "@/lib/prisma";
import * as XLSX from 'xlsx';
import { revalidatePath } from "next/cache";

export async function getMasterEmployees(page: number = 1, limit: number = 50, search: string = "") {
    try {
        const skip = (page - 1) * limit;
        const where = search ? {
            OR: [
                { name: { contains: search, mode: 'insensitive' as any } },
                { uniqueId: { contains: search, mode: 'insensitive' as any } },
                { organizationName: { contains: search, mode: 'insensitive' as any } },
                { branch: { contains: search, mode: 'insensitive' as any } },
                { designation: { contains: search, mode: 'insensitive' as any } },
            ]
        } : {};

        const [employees, total] = await Promise.all([
            (prisma as any).masterEmployee.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' }
            }),
            (prisma as any).masterEmployee.count({ where })
        ]);

        return {
            success: true,
            data: employees,
            metadata: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    } catch (error) {
        console.error("Error fetching master employees:", error);
        return { success: false, error: "Failed to fetch master employees" };
    }
}

function parseDate(value: any): Date | null {
    if (!value) return null;

    // If already a Date object
    if (value instanceof Date && !isNaN(value.getTime())) return value;

    // If Excel serial number (number)
    if (typeof value === 'number') {
        // Excel base date is Dec 30 1899
        return new Date(Math.round((value - 25569) * 86400 * 1000));
    }

    // String parsing
    const str = String(value).trim();

    // Try standard Date.parse
    const timestamp = Date.parse(str);
    if (!isNaN(timestamp)) return new Date(timestamp);

    // Try parsing "DD Month YYYY" or "DD-MM-YYYY" manually if needed
    // But Date.parse handles "27 March 2017" well.

    return null;
}

export async function uploadMasterDatabase(formData: FormData) {
    try {
        const file = formData.get('file') as File;
        if (!file) {
            return { success: false, error: "No file uploaded" };
        }

        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // Read as array of arrays to find the header row
        const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

        if (rawData.length === 0) {
            return { success: false, error: "Sheet is empty" };
        }

        // Find header row
        let headerRowIndex = -1;
        let keys: string[] = [];

        for (let i = 0; i < Math.min(rawData.length, 10); i++) {
            const row = rawData[i];
            const rowStr = row.join(' ').toLowerCase();
            // Check for critical columns in this row
            if (rowStr.includes('unique') && rowStr.includes('name')) {
                headerRowIndex = i;
                keys = row.map(cell => String(cell).trim());
                break;
            }
        }

        if (headerRowIndex === -1) {
            // Fallback: Use first row if we couldn't find a clear header
            headerRowIndex = 0;
            keys = (rawData[0] as any[]).map(cell => String(cell).trim());
            console.log("Could not find header row with 'Unique' and 'Name'. Using first row:", keys);
        }

        const mapColumn = (keywords: string[]) => {
            return keys.find(key => keywords.some(k => key.toLowerCase().includes(k.toLowerCase())));
        };

        const colUniqueId = mapColumn(['unique', 'aadhar', 'uid', 'id number', 'aadhaar']);
        const colOrgName = mapColumn(['organization', 'org', 'company', 'unit']);
        const colStatus = mapColumn(['status', 'employment', 'type', 'state']);
        const colEmpId = mapColumn(['employee id', 'emp id', 'reg id', 'staff id']);
        const colName = mapColumn(['name', 'employee name', 'full name', 'worker name']);
        const colBranch = mapColumn(['branch', 'location', 'site', 'factory', 'plant']);
        const colDesignation = mapColumn(['designation', 'role', 'position', 'job title']);
        const colDoj = mapColumn(['joining', 'doj', 'date of joining', 'joining date']);

        if (!colUniqueId || !colName) {
            return {
                success: false,
                error: `Critical columns not found. Detected headers: [${keys.join(', ')}]. Expected 'Unique ID' and 'Name'.`
            };
        }

        const coreCols = [colUniqueId, colOrgName, colStatus, colEmpId, colName, colBranch, colDesignation, colDoj].filter(Boolean) as string[];

        // Parse data using found headers
        const validRows: any[] = [];
        const errors: string[] = [];
        const seenIds = new Set<string>();

        // Start reading from the row AFTER the header
        for (let i = headerRowIndex + 1; i < rawData.length; i++) {
            const rowArray = rawData[i];
            // Map row array to object based on keys indices
            const row: any = {};
            keys.forEach((key, idx) => {
                row[key] = rowArray[idx];
            });

            const rowNum = i + 1;
            const uniqueId = String(row[colUniqueId!] || '').trim();

            if (!uniqueId) {
                // Skip empty rows silently
                continue;
            }

            if (seenIds.has(uniqueId)) {
                errors.push(`Row ${rowNum}: Duplicate Unique ID '${uniqueId}'`);
                continue;
            }

            seenIds.add(uniqueId);

            const additionalData: Record<string, any> = {};
            keys.forEach((key, idx) => {
                if (!coreCols.includes(key)) {
                    additionalData[key] = rowArray[idx];
                }
            });

            const dojRaw = colDoj ? row[colDoj] : null;
            const doj = parseDate(dojRaw);

            validRows.push({
                uniqueId: uniqueId,
                organizationName: colOrgName ? String(row[colOrgName] || '') : 'Unknown',
                employmentStatus: colStatus ? String(row[colStatus] || '') : 'Unknown',
                employeeId: colEmpId ? String(row[colEmpId] || '') : null,
                name: colName ? String(row[colName] || '') : 'Unknown',
                branch: colBranch ? String(row[colBranch] || '') : 'Unknown',
                designation: colDesignation ? String(row[colDesignation] || '') : 'Unknown',
                dateOfJoining: doj,
                additionalData: JSON.stringify(additionalData),
            });
        }

        if (validRows.length === 0) {
            return { success: false, error: "No valid rows found. Please check the file content." };
        }

        await prisma.$transaction(async (tx) => {
            await (tx as any).masterEmployee.deleteMany();
            await (tx as any).masterEmployee.createMany({
                data: validRows
            });
        });

        revalidatePath('/admin/reports/organizational-report');

        let message = `Successfully imported ${validRows.length} employees.`;
        if (errors.length > 0) {
            message += ` ${errors.length} duplicates skipped.`;
        }

        return { success: true, message: message, errors: errors };

    } catch (error) {
        console.error("Error uploading master database:", error);
        return { success: false, error: "System Error: " + (error as Error).message };
    }
}

export async function resetSystem() {
    try {
        await (prisma as any).masterEmployee.deleteMany();
        revalidatePath('/admin/reports/organizational-report');
        return { success: true, message: "System reset successfully" };
    } catch (error) {
        return { success: false, error: "Failed to reset system" };
    }
}

export async function updateMasterEmployee(id: string, data: any) {
    try {
        // Separate core fields from additionalData
        const coreFields = ['name', 'uniqueId', 'organizationName', 'employmentStatus', 'employeeId', 'branch', 'designation', 'dateOfJoining'];
        const updateData: any = {};
        const additionalData: any = {};

        Object.keys(data).forEach(key => {
            if (coreFields.includes(key)) {
                updateData[key] = data[key];
            } else if (key !== 'id' && key !== 'createdAt' && key !== 'updatedAt') {
                additionalData[key] = data[key];
            }
        });

        if (Object.keys(additionalData).length > 0) {
            updateData.additionalData = JSON.stringify(additionalData);
        }

        await (prisma as any).masterEmployee.update({
            where: { id },
            data: updateData
        });

        revalidatePath('/admin/reports/organizational-report');
        return { success: true, message: "Employee updated successfully" };
    } catch (error) {
        console.error("Error updating employee:", error);
        return { success: false, error: "Failed to update employee" };
    }
}

export async function deleteMasterEmployee(id: string) {
    try {
        await (prisma as any).masterEmployee.delete({
            where: { id }
        });
        revalidatePath('/admin/reports/organizational-report');
        return { success: true, message: "Employee deleted successfully" };
    } catch (error) {
        console.error("Error deleting employee:", error);
        return { success: false, error: "Failed to delete employee" };
    }
}

type ComparisonResult = {
    newEmployees: any[];
    resignedEmployees: any[];
    statusChanges: any[];
    transfers: any[];
};

export async function compareOrgSheet(formData: FormData, orgName: string) {
    try {
        const file = formData.get('file') as File;
        if (!file) return { success: false, error: "No file uploaded" };

        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'buffer' });

        // Auto-detect sheets
        const sheetNames = workbook.SheetNames;
        const findSheet = (keywords: string[]) => sheetNames.find(s => keywords.some(k => s.toLowerCase().includes(k)));

        const staffSheetName = findSheet(['staff', 'permanent']);
        const trialSheetName = findSheet(['trial', 'probation']);
        const contractSheetName = findSheet(['contract']);

        if (!staffSheetName && !trialSheetName && !contractSheetName) {
            return { success: false, error: "Could not detect Staff, Trial, or Contract sheets." };
        }

        const parseSheet = (sheetName: string | undefined, status: string) => {
            if (!sheetName) return [];
            const json = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
            if (json.length === 0) return [];

            const keys = Object.keys(json[0] as object);

            // Mapper helper
            const mapColumn = (keywords: string[]) => keys.find(key =>
                keywords.some(k => key.toLowerCase().includes(k))
            );

            const colUniqueId = mapColumn(['unique', 'aadhar', 'uid', 'id number', 'aadhaar']);
            const colName = mapColumn(['name', 'employee name', 'full name', 'worker name']);
            const colEmpId = mapColumn(['employee id', 'emp id', 'reg id', 'staff id']);
            const colBranch = mapColumn(['branch', 'location', 'site', 'factory', 'plant']);
            const colDesignation = mapColumn(['designation', 'role', 'position', 'job title']);
            const colDoj = mapColumn(['joining', 'doj', 'date of joining', 'joining date']);

            if (!colUniqueId || !colName) return [];

            const coreColsSet = new Set([colUniqueId, colName, colEmpId, colBranch, colDesignation, colDoj].filter(Boolean) as string[]);

            return json.map((row: any) => {
                const additionalData: Record<string, any> = {};
                keys.forEach(key => {
                    if (!coreColsSet.has(key)) {
                        additionalData[key] = row[key];
                    }
                });

                // Parse DOJ
                let doj: Date | null = null;
                const rawDoj = colDoj ? row[colDoj] : null;
                if (rawDoj) {
                    const parsedDate = new Date(rawDoj);
                    if (!isNaN(parsedDate.getTime())) doj = parsedDate;
                }

                return {
                    uniqueId: String(row[colUniqueId]).trim(),
                    name: String(row[colName] || 'Unknown'),
                    employeeId: colEmpId ? String(row[colEmpId] || '') : null,
                    branch: colBranch ? String(row[colBranch] || '') : 'Unknown',
                    designation: colDesignation ? String(row[colDesignation] || '') : 'Unknown',
                    dateOfJoining: doj,
                    status: status,
                    additionalData: JSON.stringify(additionalData)
                };
            }).filter(r => r.uniqueId);
        };

        const staff = parseSheet(staffSheetName, 'Permanent');
        const trial = parseSheet(trialSheetName, 'On Trial');
        const contract = parseSheet(contractSheetName, 'Contract');

        const allUploaded = [...staff, ...trial, ...contract];
        const uploadedIds = new Set(allUploaded.map(e => e.uniqueId));

        // Fetch Master Data
        const masterEmployees = await (prisma as any).masterEmployee.findMany();
        const masterMap = new Map<string, any>(masterEmployees.map((e: any) => [e.uniqueId, e]));


        const result: ComparisonResult = {
            newEmployees: [],
            resignedEmployees: [],
            statusChanges: [],
            transfers: []
        };

        // 1. New Employees
        for (const emp of allUploaded) {
            if (!masterMap.has(emp.uniqueId)) {
                result.newEmployees.push(emp);
            }
        }

        // 2. Resigned Employees (In Master for THIS Org, but not in Uploaded)
        // We only check for the current organization in Master
        for (const emp of masterEmployees) {
            if (emp.organizationName === orgName && !uploadedIds.has(emp.uniqueId)) {
                result.resignedEmployees.push(emp);
            }
        }

        // 3. Status Change (On Trial -> Staff)
        for (const emp of staff) {
            const masterEmp = masterMap.get(emp.uniqueId);
            if (masterEmp && masterEmp.employmentStatus === 'On Trial') {
                result.statusChanges.push({
                    ...emp,
                    oldStatus: 'On Trial',
                    newStatus: 'Permanent'
                });
            }
        }

        // 4. Inter-Org Transfer
        for (const emp of allUploaded) {
            const masterEmp = masterMap.get(emp.uniqueId);
            if (masterEmp && masterEmp.organizationName !== orgName) {
                result.transfers.push({
                    ...emp,
                    oldOrg: masterEmp.organizationName,
                    newOrg: orgName
                });
            }
        }

        return { success: true, data: result };

    } catch (error) {
        console.error("Error comparing sheets:", error);
        return { success: false, error: "Failed to compare sheets" };
    }
}

export async function applyChanges(changes: {
    newEmployees?: any[],
    statusChanges?: any[],
    transfers?: any[],
    orgName: string
}) {
    try {
        await prisma.$transaction(async (tx) => {
            // Add New Employees
            if (changes.newEmployees) {
                for (const emp of changes.newEmployees) {
                    await (tx as any).masterEmployee.create({
                        data: {
                            uniqueId: emp.uniqueId,
                            name: emp.name,
                            organizationName: changes.orgName,
                            employmentStatus: emp.status,
                            employeeId: emp.employeeId,
                            branch: emp.branch || changes.orgName,
                            designation: emp.designation || 'Unknown',
                            dateOfJoining: emp.dateOfJoining ? new Date(emp.dateOfJoining) : null,
                            additionalData: emp.additionalData
                        }
                    });
                }
            }

            // Update Status
            if (changes.statusChanges) {
                for (const emp of changes.statusChanges) {
                    await (tx as any).masterEmployee.update({
                        where: { uniqueId: emp.uniqueId },
                        data: { employmentStatus: emp.newStatus }
                    });
                }
            }

            // Transfers
            if (changes.transfers) {
                for (const emp of changes.transfers) {
                    await (tx as any).masterEmployee.update({
                        where: { uniqueId: emp.uniqueId },
                        data: {
                            organizationName: changes.orgName,
                            employmentStatus: emp.status
                        }
                    });
                }
            }
        });

        revalidatePath('/admin/reports/organizational-report');
        return { success: true, message: "Changes applied successfully" };
    } catch (error) {
        console.error("Error applying changes:", error);
        return { success: false, error: "Failed to apply changes" };
    }
}

// Organization Management

export async function getOrganizations() {
    try {
        let orgs = await (prisma as any).organization.findMany({
            orderBy: { order: 'asc' }
        });

        // Seed default organizations if empty
        if (orgs.length === 0) {
            const defaults = [
                "Autobahn Trucking",
                "Autobahn TerraGo",
                "Autobahn VoltiGo Mumbai",
                "Autobahn VoltiGo Ambegaon"
            ];

            await (prisma as any).organization.createMany({
                data: defaults.map((name, index) => ({ name, order: index }))
            });

            orgs = await (prisma as any).organization.findMany({
                orderBy: { order: 'asc' }
            });
        }

        return { success: true, data: orgs };
    } catch (error) {
        console.error("Error fetching organizations:", error);
        return { success: false, error: "Failed to fetch organizations" };
    }
}

export async function addOrganization(name: string) {
    try {
        const count = await (prisma as any).organization.count();
        await (prisma as any).organization.create({
            data: { name, order: count }
        });
        revalidatePath('/admin/reports/organizational-report');
        return { success: true, message: "Organization added successfully" };
    } catch (error) {
        return { success: false, error: "Failed to add organization" };
    }
}

export async function updateOrganization(id: string, name: string, order: number) {
    try {
        const oldOrg = await (prisma as any).organization.findUnique({ where: { id } });

        await (prisma as any).organization.update({
            where: { id },
            data: { name, order }
        });

        // If name changed, update Master DB references
        if (oldOrg && oldOrg.name !== name) {
            await (prisma as any).masterEmployee.updateMany({
                where: { organizationName: oldOrg.name },
                data: { organizationName: name }
            });
        }

        revalidatePath('/admin/reports/organizational-report');
        return { success: true, message: "Organization updated successfully" };
    } catch (error) {
        return { success: false, error: "Failed to update organization" };
    }
}

export async function deleteOrganization(id: string) {
    try {
        await (prisma as any).organization.delete({ where: { id } });
        revalidatePath('/admin/reports/organizational-report');
        return { success: true, message: "Organization deleted successfully" };
    } catch (error) {
        return { success: false, error: "Failed to delete organization" };
    }
}
