import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

async function seedVipLevels() {
  const existing = await prisma.vIPLevel.findFirst();
  if (existing) return;

  const levels = Array.from({ length: 12 }).map((_, i) => {
    const level = i + 1;
    return {
      level,
      title: `VIP ${level}`,
      price: new Prisma.Decimal(level * 50),
      percentage: new Prisma.Decimal(level * 1.5),
      dailyGains: new Prisma.Decimal(level * 2),
      delayDays: 0,
      description: `Niveau VIP ${level}`,
    };
  });

  await prisma.vIPLevel.createMany({ data: levels });
}

async function seedOperateurs() {
  const existing = await prisma.operateur.findFirst();
  if (existing) return;

  await prisma.operateur.createMany({
    data: [
      {
        numeroAgent: '0970000000',
        nomAgent: 'Agent Orange',
        operateur: 'orange',
      },
      {
        numeroAgent: '0990000000',
        nomAgent: 'Agent Airtel',
        operateur: 'airtel',
      },
      {
        numeroAgent: '0810000000',
        nomAgent: 'Agent M-Pesa',
        operateur: 'mpesa',
      },
    ],
  });
}

async function main() {
  await seedVipLevels();
  await seedOperateurs();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
