/**
 * Create Admin User Script
 * Run this ONCE to create the default admin user
 * 
 * Usage: node scripts/create-admin.js
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdminUser() {
    try {
        // Check if admin already exists
        const existingAdmin = await prisma.user.findUnique({
            where: { email: 'admin@example.com' }
        });

        if (existingAdmin) {
            console.log('✅ Admin user already exists!');
            console.log('Email: admin@example.com');
            console.log('Password: admin123');
            return;
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash('admin123', 10);

        // Create admin user
        const admin = await prisma.user.create({
            data: {
                email: 'admin@example.com',
                name: 'System Administrator',
                password: hashedPassword,
                role: 'ADMIN'
            }
        });

        console.log('✅ Admin user created successfully!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('Login Credentials:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('Email:    admin@example.com');
        console.log('Password: admin123');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('⚠️  IMPORTANT: Change this password after first login!');

    } catch (error) {
        console.error('❌ Error creating admin user:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createAdminUser();
