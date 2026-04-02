const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function main() {
    console.log("Starting diagnosis...");

    // 1. Check Env Vars
    const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
    if (!secret) {
        console.error("❌ ERROR: AUTH_SECRET or NEXTAUTH_SECRET is missing from environment variables.");
    } else {
        console.log("✅ AUTH_SECRET/NEXTAUTH_SECRET is present.");
    }

    if (!process.env.DATABASE_URL) {
        console.error("❌ ERROR: DATABASE_URL is missing.");
    } else {
        console.log("✅ DATABASE_URL is present.");
    }

    // 2. Check DB Connection
    const prisma = new PrismaClient();
    try {
        await prisma.$connect();
        console.log("✅ Database connection successful.");

        const userCount = await prisma.user.count();
        console.log(`✅ Database has ${userCount} users.`);
        
        const admin = await prisma.user.findUnique({
            where: { email: 'admin@lms.com' }
        });

        if (admin) {
             console.log("✅ Admin user found: admin@lms.com");
             // 3. Test Password
             const isMatch = await bcrypt.compare('admin123', admin.password);
             if (isMatch) {
                 console.log("✅ Password validation successful.");
             } else {
                 console.error("❌ ERROR: Password validation failed for admin123.");
             }
        } else {
            console.error("❌ ERROR: Admin user 'admin@lms.com' not found.");
        }

    } catch (e) {
        console.error("❌ ERROR: Database connection failed:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();

