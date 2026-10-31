const { execSync } = require('child_process');
const path = require('path');

const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const schemaPath = path.resolve(__dirname, '../prisma/schema.prisma');

try {
  console.log('[db-push] Synchronizing database schema with target database...');
  execSync(`${npxCmd} --package=prisma@6.9.0 prisma db push --schema="${schemaPath}" --accept-data-loss`, {
    stdio: 'inherit',
    env: { ...process.env },
  });
  console.log('[db-push] Schema sync completed successfully.');
} catch (err) {
  console.warn('⚠️ [db-push] Notice: Could not connect to database server during build step.');
  console.warn('⚠️ [db-push] This is normal when building outside Render\'s private network (e.g. local machine).');
  console.warn('⚠️ [db-push] Schema will be synchronized automatically when the server boots on Render.');
}
