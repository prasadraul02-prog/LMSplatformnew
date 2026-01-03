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
                { employeeId: { contains: search, mode: 'insensitive' as any } },
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

// Helper function to create intimations/alerts
async function createIntimation(type: string, data: any) {
    const messages: Record<string, string> = {
        STATUS_CHANGE: `Employee ${data.name} (${data.uniqueId}) status changed from ${data.oldStatus} to ${data.newStatus} in ${data.organization}`,
        TRANSFER: `Employee ${data.name} (${data.uniqueId}) transferred from ${data.fromOrg} to ${data.toOrg}`,
        RESIGNATION: `Employee ${data.name} (${data.uniqueId}) resigned from ${data.organization} - Type: ${data.resignationType}`,
        EMPLOYEE_ID_CHANGE: `Employee ${data.name} (${data.uniqueId}) ID changed from ${data.oldEmployeeId} to ${data.newEmployeeId}`
    };

    try {
        await (prisma as any).intimation.create({
            data: {
                type,
                title: `${type.replace(/_/g, ' ')} Alert`,
                message: messages[type] || 'Employee data updated',
                relatedUniqueId: data.uniqueId,
                relatedEmployeeName: data.name,
                priority: (type === 'TRANSFER' || type === 'RESIGNATION') ? 'HIGH' : 'NORMAL'
            }
        });
    } catch (error) {
        console.error('Error creating intimation:', error);
    }
}

// Helper function to log employee history
async function logEmployeeHistory(uniqueId: string, changeType: string, oldValue: any, newValue: any, remarks?: string) {
    try {
        await (prisma as any).employeeHistory.create({
            data: {
                uniqueId,
                changeType,
                oldValue: oldValue ? JSON.stringify(oldValue) : null,
                newValue: newValue ? JSON.stringify(newValue) : null,
                organizationFrom: oldValue?.organizationName || oldValue?.organization,
                organizationTo: newValue?.organizationName || newValue?.organization,
                remarks,
                processedBy: 'SYSTEM'
            }
        });
    } catch (error) {
        console.error('Error logging employee history:', error);
    }
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
            // Clean function to remove dots, spaces, and special chars for better matching
            const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
            return keys.find(key => {
                const cleanKey = clean(key);
                return keywords.some(k => {
                    const cleanKeyword = clean(k);
                    return cleanKey.includes(cleanKeyword) || cleanKeyword.includes(cleanKey);
                });
            });
        };

        const colUniqueId = mapColumn(['unique', 'aadhar', 'uid', 'id number', 'aadhaar']);
        const colOrgName = mapColumn(['organization', 'org', 'company', 'unit']);
        const colStatus = mapColumn(['status', 'employment', 'type', 'state']);
        const colEmpId = mapColumn(['employee id', 'emp id', 'empid', 'reg id', 'staff id']);
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
                createdAt: new Date('2000-01-01'), // Mark as legacy to avoid highlights
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

            // Save column order metadata
            // Delete existing column metadata and create new one
            await (tx as any).columnMetadata.deleteMany();
            await (tx as any).columnMetadata.create({
                data: {
                    columnOrder: JSON.stringify(keys)
                }
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

type EnhancedComparisonResult = {
    newEmployees: any[];
    statusChanges: any[];
    resignations: any[];
    transfers: any[];
    employeeIdChanges: any[];
};

export async function compareOrgSheet(formData: FormData, orgName: string) {
    try {
        const file = formData.get('file') as File;
        if (!file) return { success: false, error: "No file uploaded" };

        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'buffer' });

        // Auto-detect all 6 sheet types
        const sheetNames = workbook.SheetNames;
        const findSheet = (keywords: string[]) => sheetNames.find(s => keywords.some(k => s.toLowerCase().includes(k)));

        const staffSheetName = findSheet(['staff', 'permanent']);
        const trialSheetName = findSheet(['trial', 'probation']) && !findSheet(['discontinue']) ? findSheet(['trial', 'probation']) : undefined;
        const contractSheetName = findSheet(['contract']);

        // New sheet types
        const resignedSheetName: string | undefined = sheetNames.find(s =>
            s.toLowerCase().includes('resign') &&
            !s.toLowerCase().includes('discontinue')
        );
        const trialDiscontinueSheetName: string | undefined = sheetNames.find(s =>
            s.toLowerCase().includes('trial') &&
            s.toLowerCase().includes('discontinue')
        );
        const transferSheetName: string | undefined = sheetNames.find(s =>
            s.toLowerCase().includes('transfer') ||
            s.toLowerCase().includes('kerala')
        );

        if (!staffSheetName && !trialSheetName && !contractSheetName) {
            return { success: false, error: "Could not detect Staff, Trial, or Contract sheets." };
        }

        // Enhanced parseSheet function
        const parseSheet = (sheetName: string | undefined, status: string, isResignation: boolean = false) => {
            if (!sheetName) return [];
            const json = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
            if (json.length === 0) return [];

            const keys = Object.keys(json[0] as object);

            // Mapper helper with dots/spaces cleaning
            const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
            const mapColumn = (keywords: string[]) => {
                const cleanKeywords = keywords.map(clean);
                return keys.find(key => {
                    const cleanKey = clean(key);
                    return cleanKeywords.some(ck => cleanKey.includes(ck) || ck.includes(cleanKey));
                });
            };

            const colUniqueId = mapColumn(['unique', 'aadhar', 'uid', 'idnumber', 'aadhaar']);
            const colName = mapColumn(['name', 'employeename', 'fullname', 'workername', 'employee_name']);
            const colEmpId = mapColumn(['employeeid', 'empid', 'regid', 'staffid', 'employee_id', 'code', 'emp id', 'employee id']);
            const colBranch = mapColumn(['branch', 'location', 'site', 'factory', 'plant', 'unit']);
            const colDesignation = mapColumn(['designation', 'role', 'position', 'jobtitle', 'desig']);
            const colDoj = mapColumn(['joining', 'doj', 'dateofjoining', 'joiningdate', 'date_of_joining']);
            const colMobile = mapColumn(['mobile', 'phone', 'contact', 'tele', 'cell', 'whatsapp']);
            const colDept = mapColumn(['department', 'departments', 'dept', 'function', 'team', 'unit', 'vertical', 'division']);
            const colSrNo = mapColumn(['srno', 'serial', 'number', 'slno', 'index', 'sr.no']);
            const colOrg = mapColumn(['organization', 'org', 'company', 'firm', 'unitname']);
            const colRemarks = mapColumn(['remarks', 'remark', 'reason', 'comment', 'note']);
            const colResignDate = mapColumn(['resigndate', 'resignationdate', 'lastworkingday', 'exitdate']);

            if (!colUniqueId || !colName) return [];

            const coreColsSet = new Set([colUniqueId, colName, colEmpId, colBranch, colDesignation, colDoj, colMobile, colDept, colSrNo, colOrg, colRemarks, colResignDate].filter(Boolean) as string[]);

            return json.map((row: any) => {
                const additionalData: Record<string, any> = {};
                keys.forEach(key => {
                    if (!coreColsSet.has(key)) {
                        additionalData[key] = row[key];
                    }
                });

                // Mobile Number preservation
                if (colMobile && row[colMobile]) {
                    additionalData['Mobile Number'] = String(row[colMobile]).trim();
                }

                // Parse DOJ
                const rawDoj = colDoj ? row[colDoj] : null;
                const doj = rawDoj ? parseDate(rawDoj) : null;

                // Parse resignation date if applicable
                const rawResignDate = colResignDate ? row[colResignDate] : null;
                const resignDate = rawResignDate ? parseDate(rawResignDate) : null;

                return {
                    uniqueId: String(row[colUniqueId] || '').trim(),
                    name: String(row[colName] || 'Unknown').trim(),
                    employeeId: colEmpId ? String(row[colEmpId] || '').trim() : null,
                    department: colDept ? String(row[colDept] || '').trim() : '',
                    branch: colBranch ? String(row[colBranch] || '').trim() : '',
                    designation: colDesignation ? String(row[colDesignation] || '').trim() : '',
                    dateOfJoining: doj ? doj.toISOString() : null,
                    status: status,
                    srNo: colSrNo ? String(row[colSrNo] || '').trim() : null,
                    organizationName: colOrg ? String(row[colOrg] || '').trim() : '',
                    remarks: colRemarks ? String(row[colRemarks] || '').trim() : '',
                    resignationDate: resignDate ? resignDate.toISOString() : null,
                    isResignation,
                    additionalData: JSON.stringify(additionalData)
                };
            }).filter(r => r.uniqueId);
        };

        // Standardized org name for comparison
        const currentOrg = orgName.trim();

        // Parse all sheet types
        const staff = parseSheet(staffSheetName, 'Active');
        const trial = parseSheet(trialSheetName, 'Active - On Trial');
        const contract = parseSheet(contractSheetName, 'Active - Contract');
        const resigned = parseSheet(resignedSheetName, 'Resigned', true);
        const trialDiscontinue = parseSheet(trialDiscontinueSheetName, 'Resigned - Trial Discontinue', true);
        const transferred = parseSheet(transferSheetName, 'Transferred', false);

        const allActive = [...staff, ...trial, ...contract];
        const allResigned = [...resigned, ...trialDiscontinue];
        const activeIds = new Set(allActive.map(e => e.uniqueId));
        const resignedIds = new Set(allResigned.map(e => e.uniqueId));
        const transferredIds = new Set(transferred.map(e => e.uniqueId));

        // Fetch Master Data
        const masterEmployees = await (prisma as any).masterEmployee.findMany();
        const masterMap = new Map<string, any>(masterEmployees.map((e: any) => [e.uniqueId, e]));

        const result: EnhancedComparisonResult = {
            newEmployees: [],
            statusChanges: [],
            resignations: [],
            transfers: [],
            employeeIdChanges: []
        };

        // 1. New Employees (not in Master DB)
        for (const emp of allActive) {
            if (!masterMap.has(emp.uniqueId)) {
                result.newEmployees.push({
                    ...emp,
                    organization: currentOrg
                });
            }
        }

        // 2. Resignations from sheets
        for (const emp of allResigned) {
            const masterEmp = masterMap.get(emp.uniqueId);
            if (masterEmp && masterEmp.organizationName.trim() === currentOrg) {
                result.resignations.push({
                    uniqueId: emp.uniqueId,
                    name: emp.name,
                    organization: currentOrg,
                    resignationType: emp.status === 'Resigned - Trial Discontinue' ? 'ON_TRIAL_DISCONTINUE' : 'NORMAL',
                    remarks: emp.remarks || (emp.status === 'Resigned - Trial Discontinue' ? 'Resigned during trial period' : ''),
                    resignationDate: emp.resignationDate
                });
            }
        }

        // 2.1 Automatic Resignation Detection (Missing from all active sheets for this org)
        const masterOrgEmployees = masterEmployees.filter((e: any) =>
            e.organizationName.trim() === currentOrg &&
            !e.employmentStatus.toLowerCase().includes('resigned') &&
            !e.employmentStatus.toLowerCase().includes('deactive')
        );

        for (const masterEmp of masterOrgEmployees) {
            if (!activeIds.has(masterEmp.uniqueId) &&
                !resignedIds.has(masterEmp.uniqueId) &&
                !transferredIds.has(masterEmp.uniqueId)) {

                // Only add if not already in result.resignations
                if (!result.resignations.some(r => r.uniqueId === masterEmp.uniqueId)) {
                    result.resignations.push({
                        uniqueId: masterEmp.uniqueId,
                        name: masterEmp.name,
                        organization: currentOrg,
                        resignationType: 'NORMAL',
                        remarks: 'Automatically detected exit (Missing from active sheets)',
                        resignationDate: new Date().toISOString()
                    });
                }
            }
        }

        // 3. Status Changes (bidirectional)
        for (const emp of staff) {
            const masterEmp = masterMap.get(emp.uniqueId);
            if (masterEmp && masterEmp.organizationName.trim() === currentOrg) {
                // On Trial → Staff
                if (masterEmp.employmentStatus.toLowerCase().includes('trial')) {
                    result.statusChanges.push({
                        uniqueId: emp.uniqueId,
                        name: emp.name,
                        oldStatus: masterEmp.employmentStatus,
                        newStatus: 'Active',
                        oldEmployeeId: masterEmp.employeeId,
                        newEmployeeId: emp.employeeId,
                        organization: currentOrg
                    });
                }
                // Contract → Staff
                else if (masterEmp.employmentStatus.toLowerCase().includes('contract')) {
                    result.statusChanges.push({
                        uniqueId: emp.uniqueId,
                        name: emp.name,
                        oldStatus: masterEmp.employmentStatus,
                        newStatus: 'Active',
                        oldEmployeeId: masterEmp.employeeId,
                        newEmployeeId: emp.employeeId,
                        organization: currentOrg
                    });
                }
            }
        }

        for (const emp of trial) {
            const masterEmp = masterMap.get(emp.uniqueId);
            if (masterEmp && masterEmp.organizationName.trim() === currentOrg) {
                // Staff → On Trial
                if (masterEmp.employmentStatus === 'Active' || masterEmp.employmentStatus === 'Permanent') {
                    result.statusChanges.push({
                        uniqueId: emp.uniqueId,
                        name: emp.name,
                        oldStatus: masterEmp.employmentStatus,
                        newStatus: 'Active - On Trial',
                        oldEmployeeId: masterEmp.employeeId,
                        newEmployeeId: emp.employeeId,
                        organization: currentOrg
                    });
                }
                // Contract → On Trial
                else if (masterEmp.employmentStatus.toLowerCase().includes('contract')) {
                    result.statusChanges.push({
                        uniqueId: emp.uniqueId,
                        name: emp.name,
                        oldStatus: masterEmp.employmentStatus,
                        newStatus: 'Active - On Trial',
                        oldEmployeeId: masterEmp.employeeId,
                        newEmployeeId: emp.employeeId,
                        organization: currentOrg
                    });
                }
            }
        }

        for (const emp of contract) {
            const masterEmp = masterMap.get(emp.uniqueId);
            if (masterEmp && masterEmp.organizationName.trim() === currentOrg) {
                // Staff → Contract
                if (masterEmp.employmentStatus === 'Active' || masterEmp.employmentStatus === 'Permanent') {
                    result.statusChanges.push({
                        uniqueId: emp.uniqueId,
                        name: emp.name,
                        oldStatus: masterEmp.employmentStatus,
                        newStatus: 'Active - Contract',
                        oldEmployeeId: masterEmp.employeeId,
                        newEmployeeId: emp.employeeId,
                        organization: currentOrg
                    });
                }
            }
        }

        // 4. Inter-Organizational Transfers (Appearing in this sheet but from another org)
        for (const emp of allActive) {
            const masterEmp = masterMap.get(emp.uniqueId);
            if (masterEmp && masterEmp.organizationName.trim() !== currentOrg && masterEmp.organizationName !== '') {
                result.transfers.push({
                    uniqueId: emp.uniqueId,
                    name: emp.name,
                    fromOrg: masterEmp.organizationName,
                    toOrg: currentOrg,
                    oldEmployeeId: masterEmp.employeeId,
                    newEmployeeId: emp.employeeId,
                    transferType: 'INTER_ORG'
                });
            }
        }

        // 5. Transfer to Kerala/Other locations
        for (const emp of transferred) {
            const masterEmp = masterMap.get(emp.uniqueId);
            if (masterEmp && masterEmp.organizationName.trim() === currentOrg) {
                result.transfers.push({
                    uniqueId: emp.uniqueId,
                    name: emp.name,
                    fromOrg: currentOrg,
                    toOrg: emp.branch || 'Kerala',
                    oldEmployeeId: masterEmp.employeeId,
                    newEmployeeId: emp.employeeId,
                    transferType: 'TO_KERALA',
                    remarks: emp.remarks
                });
            }
        }

        // 6. Employee ID Changes (without status change)
        for (const emp of allActive) {
            const masterEmp = masterMap.get(emp.uniqueId);
            if (masterEmp &&
                masterEmp.organizationName.trim() === currentOrg &&
                emp.employeeId &&
                masterEmp.employeeId &&
                emp.employeeId !== masterEmp.employeeId &&
                !result.statusChanges.some(sc => sc.uniqueId === emp.uniqueId)) {
                result.employeeIdChanges.push({
                    uniqueId: emp.uniqueId,
                    name: emp.name,
                    oldEmployeeId: masterEmp.employeeId,
                    newEmployeeId: emp.employeeId,
                    organization: currentOrg
                });
            }
        }

        return { success: true, data: result };

    } catch (error) {
        console.error("Error comparing sheets:", error);
        return { success: false, error: "Failed to compare sheets: " + (error as Error).message };
    }
}

export async function applyChanges(changes: {
    newEmployees?: any[],
    statusChanges?: any[],
    resignations?: any[],
    transfers?: any[],
    employeeIdChanges?: any[],
    orgName: string
}) {
    try {
        await prisma.$transaction(async (tx) => {
            // 1. Add New Employees
            if (changes.newEmployees) {
                for (const emp of changes.newEmployees) {
                    const newEmp = await (tx as any).masterEmployee.create({
                        data: {
                            uniqueId: emp.uniqueId,
                            name: emp.name,
                            organizationName: changes.orgName,
                            employmentStatus: emp.status,
                            employeeId: emp.employeeId,
                            department: emp.department,
                            branch: emp.branch || changes.orgName,
                            designation: emp.designation || 'Unknown',
                            dateOfJoining: emp.dateOfJoining ? new Date(emp.dateOfJoining) : null,
                            additionalData: emp.additionalData
                        }
                    });

                    await logEmployeeHistory(emp.uniqueId, 'NEW_EMPLOYEE', null, newEmp);
                }
            }

            // 2. Update Status Changes (Staff ↔ Trial ↔ Contract)
            if (changes.statusChanges) {
                for (const change of changes.statusChanges) {
                    const masterEmp = await (tx as any).masterEmployee.findUnique({
                        where: { uniqueId: change.uniqueId }
                    });

                    if (masterEmp) {
                        await (tx as any).masterEmployee.update({
                            where: { uniqueId: change.uniqueId },
                            data: {
                                employmentStatus: change.newStatus,
                                employeeId: change.newEmployeeId || masterEmp.employeeId,
                                previousEmployeeId: change.oldEmployeeId || masterEmp.employeeId,
                                lastStatusChange: new Date()
                            }
                        });

                        await (tx as any).statusChange.create({
                            data: {
                                uniqueId: change.uniqueId,
                                employeeName: change.name,
                                organizationName: change.organization,
                                oldStatus: change.oldStatus,
                                newStatus: change.newStatus,
                                oldEmployeeId: change.oldEmployeeId,
                                newEmployeeId: change.newEmployeeId,
                                applied: true,
                                appliedAt: new Date()
                            }
                        });

                        await createIntimation('STATUS_CHANGE', change);
                        await logEmployeeHistory(change.uniqueId, 'STATUS_CHANGE',
                            { status: change.oldStatus, employeeId: change.oldEmployeeId },
                            { status: change.newStatus, employeeId: change.newEmployeeId }
                        );
                    }
                }
            }

            // 3. Process Resignations
            if (changes.resignations) {
                for (const resignation of changes.resignations) {
                    const masterEmp = await (tx as any).masterEmployee.findUnique({
                        where: { uniqueId: resignation.uniqueId }
                    });

                    if (masterEmp) {
                        await (tx as any).masterEmployee.update({
                            where: { uniqueId: resignation.uniqueId },
                            data: {
                                employmentStatus: resignation.resignationType === 'ON_TRIAL_DISCONTINUE'
                                    ? 'Resigned - Trial Discontinue'
                                    : 'Resigned'
                            }
                        });

                        await (tx as any).resignation.create({
                            data: {
                                uniqueId: resignation.uniqueId,
                                employeeName: resignation.name,
                                organizationName: resignation.organization,
                                resignationType: resignation.resignationType,
                                remarks: resignation.remarks,
                                resignationDate: resignation.resignationDate ? new Date(resignation.resignationDate) : new Date(),
                                applied: true,
                                appliedAt: new Date()
                            }
                        });

                        await createIntimation('RESIGNATION', resignation);
                        await logEmployeeHistory(resignation.uniqueId, 'RESIGNATION',
                            { status: masterEmp.employmentStatus },
                            { status: 'Resigned', type: resignation.resignationType },
                            resignation.remarks
                        );
                    }
                }
            }

            // 4. Inter-Org and Shared Transfers
            if (changes.transfers) {
                for (const transfer of changes.transfers) {
                    const existing = await (tx as any).masterEmployee.findUnique({
                        where: { uniqueId: transfer.uniqueId }
                    });

                    if (existing) {
                        const history = existing.transferHistory ? JSON.parse(existing.transferHistory) : [];
                        history.push({
                            from: transfer.fromOrg,
                            to: transfer.toOrg,
                            date: new Date().toISOString(),
                            type: transfer.transferType
                        });

                        await (tx as any).masterEmployee.update({
                            where: { uniqueId: transfer.uniqueId },
                            data: {
                                organizationName: transfer.toOrg,
                                employeeId: transfer.newEmployeeId || existing.employeeId,
                                previousEmployeeId: transfer.oldEmployeeId || existing.employeeId,
                                transferHistory: JSON.stringify(history)
                            }
                        });

                        await (tx as any).organizationalTransfer.create({
                            data: {
                                uniqueId: transfer.uniqueId,
                                employeeName: transfer.name,
                                fromOrganization: transfer.fromOrg,
                                toOrganization: transfer.toOrg,
                                oldEmployeeId: transfer.oldEmployeeId,
                                newEmployeeId: transfer.newEmployeeId,
                                transferType: transfer.transferType,
                                remarks: transfer.remarks,
                                applied: true,
                                appliedAt: new Date()
                            }
                        });

                        await createIntimation('TRANSFER', transfer);
                        await logEmployeeHistory(transfer.uniqueId, 'TRANSFER',
                            { organization: transfer.fromOrg, employeeId: transfer.oldEmployeeId },
                            { organization: transfer.toOrg, employeeId: transfer.newEmployeeId },
                            transfer.remarks
                        );
                    }
                }
            }

            // 5. Employee ID Changes
            if (changes.employeeIdChanges) {
                for (const change of changes.employeeIdChanges) {
                    const masterEmp = await (tx as any).masterEmployee.findUnique({
                        where: { uniqueId: change.uniqueId }
                    });

                    if (masterEmp) {
                        await (tx as any).masterEmployee.update({
                            where: { uniqueId: change.uniqueId },
                            data: {
                                employeeId: change.newEmployeeId,
                                previousEmployeeId: change.oldEmployeeId
                            }
                        });

                        await createIntimation('EMPLOYEE_ID_CHANGE', change);
                        await logEmployeeHistory(change.uniqueId, 'EMPLOYEE_ID_CHANGE',
                            { employeeId: change.oldEmployeeId },
                            { employeeId: change.newEmployeeId }
                        );
                    }
                }
            }
        });

        revalidatePath('/admin/reports/organizational-report');
        return { success: true, message: "Changes applied successfully with intimations and history logged." };
    } catch (error) {
        console.error("Error applying changes:", error);
        return { success: false, error: "Failed to apply changes: " + (error as Error).message };
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
export async function unhighlightAll() {
    try {
        await (prisma as any).masterEmployee.updateMany({
            data: {
                createdAt: new Date('2000-01-01')
            }
        });
        revalidatePath('/admin/reports/organizational-report');
        return { success: true, message: "All employees unhighlighted successfully" };
    } catch (error) {
        console.error("Error unhighlighting employees:", error);
        return { success: false, error: "Failed to unhighlight employees" };
    }
}

export async function getColumnOrder() {
    try {
        const metadata = await (prisma as any).columnMetadata.findFirst({
            orderBy: { updatedAt: 'desc' }
        });
        if (!metadata) {
            return { success: true, data: null };
        }
        const columnOrder = JSON.parse(metadata.columnOrder);
        return { success: true, data: columnOrder };
    } catch (error) {
        console.error("Error fetching column order:", error);
        return { success: false, error: "Failed to fetch column order" };
    }
}
// --- Advanced Synchronization API ---

export async function getIntimations(unreadOnly: boolean = false) {
    try {
        const where = unreadOnly ? { read: false } : {};
        const intimations = await (prisma as any).intimation.findMany({
            where,
            orderBy: [
                { read: 'asc' },
                { priority: 'desc' },
                { createdAt: 'desc' }
            ],
            take: 100
        });
        return { success: true, data: intimations };
    } catch (error) {
        console.error("Error fetching intimations:", error);
        return { success: false, error: "Failed to fetch intimations" };
    }
}

export async function markIntimationRead(id: string) {
    try {
        await (prisma as any).intimation.update({
            where: { id },
            data: { read: true, readAt: new Date() }
        });
        revalidatePath('/admin/reports/organizational-report');
        return { success: true };
    } catch (error) {
        console.error("Error marking intimation as read:", error);
        return { success: false, error: "Failed to update intimation" };
    }
}

export async function getEmployeeHistory(uniqueId: string) {
    try {
        const history = await (prisma as any).employeeHistory.findMany({
            where: { uniqueId },
            orderBy: { createdAt: 'desc' }
        });
        return { success: true, data: history };
    } catch (error) {
        console.error("Error fetching employee history:", error);
        return { success: false, error: "Failed to fetch employee history" };
    }
}

export async function getTransfers(applied: boolean | null = null) {
    try {
        const where = applied !== null ? { applied } : {};
        const transfers = await (prisma as any).organizationalTransfer.findMany({
            where,
            orderBy: { createdAt: 'desc' }
        });
        return { success: true, data: transfers };
    } catch (error) {
        console.error("Error fetching transfers:", error);
        return { success: false, error: "Failed to fetch transfers" };
    }
}

export async function getStatusChanges(applied: boolean | null = null) {
    try {
        const where = applied !== null ? { applied } : {};
        const changes = await (prisma as any).statusChange.findMany({
            where,
            orderBy: { createdAt: 'desc' }
        });
        return { success: true, data: changes };
    } catch (error) {
        console.error("Error fetching status changes:", error);
        return { success: false, error: "Failed to fetch status changes" };
    }
}
