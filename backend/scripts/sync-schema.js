const fs = require('fs');
const path = require('path');

function getDatabaseUrl() {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL.trim();
  }

  const envFiles = [
    path.join(__dirname, '../.env'),
    path.join(__dirname, '../../.env'),
    path.join(process.cwd(), '.env'),
    path.join(process.cwd(), 'backend/.env'),
  ];

  for (const envFile of envFiles) {
    if (fs.existsSync(envFile)) {
      try {
        const content = fs.readFileSync(envFile, 'utf8');
        const match = content.match(/^DATABASE_URL\s*=\s*["']?([^"'\r\n]+)["']?/m);
        if (match && match[1]) {
          return match[1].trim();
        }
      } catch {}
    }
  }

  return 'file:./dev.db';
}

function syncSchema() {
  const dbUrl = getDatabaseUrl();
  const isPostgres = dbUrl.startsWith('postgresql:') || dbUrl.startsWith('postgres:');
  const targetProvider = isPostgres ? 'postgresql' : 'sqlite';

  const schemaPaths = [
    path.join(__dirname, '../prisma/schema.prisma'),
    path.join(__dirname, '../../prisma/schema.prisma'),
  ];

  console.log(`[sync-schema] DATABASE_URL detected: ${dbUrl.startsWith('file:') ? 'sqlite' : 'postgresql'}`);

  for (const schemaPath of schemaPaths) {
    if (fs.existsSync(schemaPath)) {
      let content = fs.readFileSync(schemaPath, 'utf8');

      // Ensure generator client is prisma-client-js
      content = content.replace(
        /generator\s+client\s*\{[^}]*\}/s,
        `generator client {\n  provider = "prisma-client-js"\n}`
      );

      // Match datasource db block
      const datasourceRegex = /datasource\s+db\s*\{([^}]*)\}/s;
      const match = content.match(datasourceRegex);
      if (match) {
        const blockContent = match[1];
        const providerMatch = blockContent.match(/provider\s*=\s*"([^"]+)"/);
        const currentProvider = providerMatch ? providerMatch[1] : null;

        if (currentProvider !== targetProvider) {
          console.log(`[sync-schema] Updating ${path.relative(process.cwd(), schemaPath)}: datasource provider "${currentProvider}" -> "${targetProvider}"`);
          const updatedBlock = blockContent.replace(/provider\s*=\s*"[^"]+"/, `provider = "${targetProvider}"`);
          content = content.replace(datasourceRegex, `datasource db {${updatedBlock}}`);
          fs.writeFileSync(schemaPath, content, 'utf8');
        }
      }
    }
  }
}

syncSchema();
