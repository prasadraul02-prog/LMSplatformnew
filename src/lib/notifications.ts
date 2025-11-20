import { prisma } from "@/lib/prisma";

export async function createNotification(userId: string, message: string) {
    try {
        await prisma.notification.create({
            data: {
                userId,
                message,
            },
        });
    } catch (error) {
        console.error("Failed to create notification", error);
    }
}
