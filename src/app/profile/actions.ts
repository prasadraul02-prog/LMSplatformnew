'use server';
// Audit check: verified build status

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

import { hash, compare } from "bcryptjs";

export async function updateAvatar(avatarStyle: string) {
    try {
        const session = await auth();

        if (!session?.user?.email) {
            return { error: "Unauthorized" };
        }

        await prisma.user.update({
            where: { email: session.user.email },
            data: { avatar: avatarStyle }
        });

        revalidatePath('/profile');
        return { success: true };
    } catch (error) {
        console.error("Error updating avatar:", error);
        return { error: "Failed to update avatar" };
    }
}

export async function updatePassword(currentPassword: string, newPassword: string) {
    try {
        const session = await auth();

        if (!session?.user?.email) {
            return { error: "Unauthorized" };
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user || !user.password) {
            return { error: "User not found" };
        }

        const isPasswordValid = await compare(currentPassword, user.password);

        if (!isPasswordValid) {
            return { error: "Invalid current password" };
        }

        const hashedPassword = await hash(newPassword, 10);

        await prisma.user.update({
            where: { email: session.user.email },
            data: { password: hashedPassword }
        });

        revalidatePath('/profile');
        return { success: true };
    } catch (error) {
        console.error("Error updating password:", error);
        return { error: "Failed to update password" };
    }
}
