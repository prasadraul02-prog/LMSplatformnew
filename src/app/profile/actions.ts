'use server';

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

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
