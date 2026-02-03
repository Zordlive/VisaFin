import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function makeAdmin() {
  const email = process.argv[2] || 'test@test.com';

  try {
    const user = await prisma.user.update({
      where: { email },
      data: { isStaff: true },
    });

    console.log(`✅ Admin enabled for: ${user.email}`);
  } catch (error) {
    console.error('❌ Unable to set admin for user:', email, error);
  } finally {
    await prisma.$disconnect();
  }
}

makeAdmin();
