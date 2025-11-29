'use server';

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import * as XLSX from 'xlsx';

const UserSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    role: z.enum(["ADMIN", "TRAINER", "EMPLOYEE"]),
    avatar: z.string().optional(),
});

export type State = {
    error?: {
        name?: string[];
        email?: string[];
        password?: string[];
        role?: string[];
        avatar?: string[];
    };
    message?: string;
    success?: boolean;
};

export async function createUser(prevState: State, formData: FormData): Promise<State> {
    const validatedFields = UserSchema.safeParse({
        name: formData.get('name'),
        email: formData.get('email'),
        password: formData.get('password'),
        role: formData.get('role'),
        avatar: formData.get('avatar'),
    });

    if (!validatedFields.success) {
        return {
            error: validatedFields.error.flatten().fieldErrors,
        };
    }

    const { name, email, password, role, avatar } = validatedFields.data;

    try {
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return {
                message: "User with this email already exists",
            };
        }

        const hashedPassword = await bcrypt.hash(password, 4);

        // Set professional defaults for new users
        // 1. Find or create a default department
        let defaultDepartment = await prisma.department.findFirst({
            where: { name: "General" }
        });

        if (!defaultDepartment) {
            defaultDepartment = await prisma.department.create({
                data: { name: "General" }
            });
        }

        // 2. Find or create a default designation based on role
        const designationName = role === "ADMIN" ? "Administrator"
            : role === "TRAINER" ? "Trainer"
                : "Employee";

        let defaultDesignation = await prisma.designation.findFirst({
            where: { name: designationName }
        });

        if (!defaultDesignation) {
            defaultDesignation = await prisma.designation.create({
                data: { name: designationName }
            });
        }

        // 3. Create user with defaults
        await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: role as any,
                avatar: avatar || 'bottts', // Default to bottts if not provided
                departmentId: defaultDepartment.id,
                designationId: defaultDesignation.id,
            },
        });

        revalidatePath('/admin/users');
        return { success: true, message: "User created successfully" };
    } catch (error) {
        console.error("Error creating user:", error);
        return { message: "Failed to create user" };
    }
}

export async function deleteUser(id: string) {
    try {
        // Cascade delete all related records before deleting the user
        // This prevents foreign key constraint violations

        // 1. Delete enrollments (this will cascade to module progress via onDelete: Cascade in schema)
        await prisma.enrollment.deleteMany({
            where: { userId: id },
        });

        // 2. Delete certificates
        await prisma.certificate.deleteMany({
            where: { userId: id },
        });

        // 3. Delete notifications
        await prisma.notification.deleteMany({
            where: { userId: id },
        });

        // 4. Delete quiz results (if they exist for this user)
        await prisma.quizResult.deleteMany({
            where: { userId: id },
        });

        // 5. For created courses, we have two options:
        // Option A: Delete all courses created by this user (destructive)
        // Option B: Reassign courses to another admin (safer)
        // For now, we'll prevent deletion if user has created courses
        const createdCourses = await prisma.course.count({
            where: { authorId: id },
        });

        if (createdCourses > 0) {
            return {
                error: `Cannot delete user: This user has created ${createdCourses} course(s). Please reassign or delete those courses first.`
            };
        }

        // 6. Finally, delete the user
        await prisma.user.delete({
            where: { id },
        });

        revalidatePath('/admin/users');
        return { success: true };
    } catch (error) {
        console.error("Error deleting user:", error);
        return { error: "Failed to delete user" };
    }
}

export async function resetUserPassword(userId: string, manualPassword?: string) {
    try {
        // Use manual password or generate a random one
        const newPassword = manualPassword || Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(newPassword, 4);

        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword }
        });

        revalidatePath('/admin/users');
        return { success: true, password: newPassword };
    } catch (error) {
        return { error: "Failed to reset password" };
    }
}

export async function updateUser(userId: string, data: { name?: string; email?: string; role?: string }) {
    try {
        await prisma.user.update({
            where: { id: userId },
            data: {
                ...(data.name && { name: data.name }),
                ...(data.email && { email: data.email }),
                ...(data.role && { role: data.role }),
            }
        });

        revalidatePath('/admin/users');
        return { success: true, message: "User updated successfully" };
    } catch (error) {
        return { error: "Failed to update user" };
    }
}

export async function importUsers(prevState: any, formData: FormData) {
    const file = formData.get('file') as File;

    if (!file) {
        return { error: "No file uploaded" };
    }

    try {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet);

        if (data.length === 0) {
            return { error: "The uploaded file is empty" };
        }

        const defaultPassword = await bcrypt.hash("Welcome123!", 4);
        let successCount = 0;
        let duplicateCount = 0;
        let usersToProcess: any[] = [];

        // Check for Transposed Format (User's specific layout)
        const nameRow = data.find((row: any) => row['Column Name'] === 'Name' || row['Column Name'] === 'name') as any;
        const emailRow = data.find((row: any) => row['Column Name'] === 'Email' || row['Column Name'] === 'email') as any;

        if (nameRow && emailRow) {
            const roleRow = data.find((row: any) => row['Column Name'] === 'Role' || row['Column Name'] === 'role') as any;
            const keys = Object.keys(nameRow).filter(k => k !== 'Column Name' && k !== 'Description');

            for (const key of keys) {
                usersToProcess.push({
                    Name: nameRow[key],
                    Email: emailRow[key],
                    Role: roleRow ? roleRow[key] : 'EMPLOYEE'
                });
            }
        } else {
            usersToProcess = data;
        }

        for (const row of usersToProcess) {
            const name = row['Name'] || row['name'];
            const email = row['Email'] || row['email'];
            const role = (row['Role'] || row['role'] || 'EMPLOYEE').toUpperCase();

            if (!name || !email) continue;

            const existingUser = await prisma.user.findUnique({
                where: { email },
            });

            if (existingUser) {
                duplicateCount++;
                continue;
            }

            await prisma.user.create({
                data: {
                    name,
                    email,
                    password: defaultPassword,
                    role: role as any,
                },
            });
            successCount++;
        }

        revalidatePath('/admin/users');
        return {
            success: true,
            message: `Import successful! Added ${successCount} users. Skipped ${duplicateCount} duplicates.`
        };

    } catch (error) {
        console.error("Import error:", error);
        return { error: "Failed to process file. Please check the format." };
    }
}
