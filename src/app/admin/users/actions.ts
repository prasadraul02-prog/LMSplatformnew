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
});

export async function createUser(prevState: any, formData: FormData) {
    const validatedFields = UserSchema.safeParse({
        name: formData.get('name'),
        email: formData.get('email'),
        password: formData.get('password'),
        role: formData.get('role'),
    });

    if (!validatedFields.success) {
        return {
            error: validatedFields.error.flatten().fieldErrors,
        };
    }

    const { name, email, password, role } = validatedFields.data;

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

        await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: role as any,
            },
        });

        revalidatePath('/admin/users');
        return { success: true, message: "User created successfully" };
    } catch (error) {
        return { message: "Failed to create user" };
    }
}

export async function deleteUser(id: string) {
    try {
        await prisma.user.delete({
            where: { id },
        });
        revalidatePath('/admin/users');
        return { success: true };
    } catch (error) {
        return { error: "Failed to delete user" };
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

        for (const row of data as any[]) {
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
