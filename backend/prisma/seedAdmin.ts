import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createAdmin() {
  const email = (process.env.ADMIN_SEED_EMAIL || 'admin@nexora.ai').toLowerCase().trim();
  const password = process.env.ADMIN_SEED_PASSWORD || 'ChangeMeImmediately!123';
  const name = process.env.ADMIN_SEED_NAME || 'Admin';

  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(password, salt);

  console.log(`Upserting admin account: ${name} (${email})...`);

  // Upsert user with admin credentials
  const adminUser = await prisma.user.upsert({
    where: { email },
    update: {
      name,
      passwordHash,
      role: 'admin',
      provider: 'credentials',
      preferences: JSON.stringify({ theme: 'dark', failedLoginAttempts: 0 }),
    },
    create: {
      email,
      name,
      passwordHash,
      role: 'admin',
      provider: 'credentials',
      preferences: JSON.stringify({ theme: 'dark' }),
    },
  });

  console.log('✅ Admin user created/updated successfully:');
  console.log(`   ID:    ${adminUser.id}`);
  console.log(`   Name:  ${adminUser.name}`);
  console.log(`   Email: ${adminUser.email}`);
  console.log(`   Role:  ${adminUser.role}`);
}

createAdmin()
  .catch((e) => {
    console.error('Error creating admin:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
