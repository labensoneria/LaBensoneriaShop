import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.error('[seed-prod] ADMIN_EMAIL and ADMIN_PASSWORD env vars are required');
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(adminPassword, 10);
  await prisma.user.upsert({
    where:  { email: adminEmail },
    update: {},
    create: { email: adminEmail, passwordHash, name: 'Admin', isAdmin: true },
  });
  console.log(`[seed-prod] ✓ Admin: ${adminEmail}`);
}

main()
  .catch((e) => { console.error('[seed-prod]', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
