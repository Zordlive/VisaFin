import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function updateTestUserPassword() {
  const newPassword = 'visafin8'; // 8 characters
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  try {
    const user = await prisma.user.update({
      where: { email: 'test@test.com' },
      data: { password: hashedPassword },
    });

    console.log(`✅ Password updated for user: ${user.email}`);
    console.log(`📝 New credentials:`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Password: ${newPassword}`);
  } catch (error) {
    console.error('❌ Error updating password:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateTestUserPassword();
