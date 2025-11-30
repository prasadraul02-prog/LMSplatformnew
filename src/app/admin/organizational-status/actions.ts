'use server'

import { prisma } from "@/lib/prisma";
import * as XLSX from 'xlsx';
import { revalidatePath } from "next/cache";

export async function getMasterEmployees() {
    try {
        const employees = await (prisma as any).masterEmployee.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return { success: true, data: employees };
    } catch (error) {
        console.error("Error fetching master employees:", error);
        return { success: false, error: "Failed to fetch master employees" };
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
        const jsonData = XLSX.utils.sheet_to_json(sheet);

        if (jsonData.length === 0) {
            return { success: false, error: "Sheet is empty" };
        }

        // Auto-detect columns
        // We look for keywords in keys
        const firstRow = jsonData[0] as any;
        const keys = Object.keys(firstRow);

        const mapColumn = (keywords: string[]) => {
            return keys.find(key => keywords.some(k => key.toLowerCase().includes(k.toLowerCase())));
        };

        const colUniqueId = mapColumn(['unique', 'aadhar', 'uid', 'id number']);
        const colOrgName = mapColumn(['organization', 'org', 'company']);
        const colStatus = mapColumn(['status', 'employment', 'type']);
        const colEmpId = mapColumn(['employee id', 'emp id', 'reg id']);
        const colName = mapColumn(['name', 'employee name', 'full name']);
        const colBranch = mapColumn(['branch', 'location', 'site']);
        const colDesignation = mapColumn(['designation', 'role', 'position']);
        const colDoj = mapColumn(['joining', 'doj', 'date of joining']);

        if (!colUniqueId || !colName) {
            return { success: false, error: "Critical columns (Unique ID, Name) not found. Please check column headers." };
        }

        // Prepare data for bulk insert/update
        // Using transaction to replace or upsert
        // The requirement says "Import Excel (replace existing master)"
        // So we delete all and insert new? Or upsert?
        // "Replace existing master" usually means wipe and load.

        await prisma.$transaction(async (tx) => {
            await (tx as any).masterEmployee.deleteMany();

            for (const row of jsonData as any[]) {
                const uniqueId = String(row[colUniqueId!] || '').trim();
                if (!uniqueId) continue;

                await (tx as any).masterEmployee.create({
                    data: {
                        uniqueId: uniqueId,
                        organizationName: colOrgName ? String(row[colOrgName] || '') : 'Unknown',
                        employmentStatus: colStatus ? String(row[colStatus] || '') : 'Unknown',
                        employeeId: colEmpId ? String(row[colEmpId] || '') : null,
                        name: colName ? String(row[colName] || '') : 'Unknown',
                        branch: colBranch ? String(row[colBranch] || '') : 'Unknown',
                        designation: colDesignation ? String(row[colDesignation] || '') : 'Unknown',
                        dateOfJoining: colDoj ? new Date(row[colDoj]) : null, // parsing date might need more robustness
                    }
                });
            }
        });

        revalidatePath('/admin/organizational-status');
        return { success: true, message: `Successfully imported ${jsonData.length} employees.` };

    } catch (error) {
        console.error("Error uploading master database:", error);
        return { success: false, error: "Failed to process file" };
    }
}

export async function resetSystem() {
    try {
        await (prisma as any).masterEmployee.deleteMany();
        revalidatePath('/admin/organizational-status');
        return { success: true, message: "System reset successfully" };
    } catch (error) {
        return { success: false, error: "Failed to reset system" };
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

        // Helper to parse sheet
        const parseSheet = (sheetName: string | undefined, status: string) => {
            if (!sheetName) return [];
            const json = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
            // Auto-detect unique ID column
            if (json.length === 0) return [];
            const keys = Object.keys(json[0] as object);
            const colUniqueId = keys.find(key => ['unique', 'aadhar', 'uid', 'id number'].some(k => key.toLowerCase().includes(k)));
            const colName = keys.find(key => ['name', 'employee name'].some(k => key.toLowerCase().includes(k)));

            if (!colUniqueId) return [];

            return json.map((row: any) => ({
                uniqueId: String(row[colUniqueId]).trim(),
                name: colName ? row[colName] : 'Unknown',
                status: status,
                raw: row
            })).filter(r => r.uniqueId);
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
                            branch: changes.orgName,
                            designation: 'Unknown',
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

        revalidatePath('/admin/organizational-status');
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
        revalidatePath('/admin/organizational-status');
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

        revalidatePath('/admin/organizational-status');
        return { success: true, message: "Organization updated successfully" };
    } catch (error) {
        return { success: false, error: "Failed to update organization" };
    }
}

export async function deleteOrganization(id: string) {
    try {
        await (prisma as any).organization.delete({ where: { id } });
        revalidatePath('/admin/organizational-status');
        return { success: true, message: "Organization deleted successfully" };
    } catch (error) {
        return { success: false, error: "Failed to delete organization" };
    }
}
