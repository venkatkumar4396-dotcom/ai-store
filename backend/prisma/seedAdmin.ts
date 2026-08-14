import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createAdmin() {
  const password = 'kumar@4396';
  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(password, salt);

  console.log('Upserting admin account: kumar (kumar@nexora.ai)...');

  // Upsert user with email kumar@nexora.ai
  const adminUser = await prisma.user.upsert({
    where: { email: 'kumar@nexora.ai' },
    update: {
      name: 'kumar',
      passwordHash,
      role: 'admin',
      provider: 'credentials',
      preferences: JSON.stringify({ theme: 'dark', failedLoginAttempts: 0 }),
    },
    create: {
      email: 'kumar@nexora.ai',
      name: 'kumar',
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
  console.log(`   Pass:  kumar@4396`);
}

createAdmin()
  .catch((e) => {
    console.error('Error creating admin:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
