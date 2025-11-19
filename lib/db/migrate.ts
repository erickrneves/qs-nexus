import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db } from './index.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
  console.log('Running migrations...');
  const migrationsFolder = join(__dirname, 'migrations');
  await migrate(db, { migrationsFolder });
  console.log('Migrations completed!');
  process.exit(0);
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});

