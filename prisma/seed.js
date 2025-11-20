const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    const password = await bcrypt.hash('admin123', 4);

    const admin = await prisma.user.upsert({
        where: { email: 'admin@lms.com' },
        update: {},
        create: {
            email: 'admin@lms.com',
            name: 'Super Admin',
            password: password,
            role: 'ADMIN',
        },
    });

    console.log({ admin });
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
