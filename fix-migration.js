// Скрипт для удаления failed миграции из Railway PostgreSQL
// Запуск: node fix-migration.js

const { Client } = require('pg');

// Railway PostgreSQL connection string
// Замените PASSWORD на реальный пароль из Railway Dashboard
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:PASSWORD@ballast.proxy.rlwy.net:58098/railway';

async function fixMigration() {
  console.log('Connecting to Railway PostgreSQL...');

  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected successfully!\n');

    // Показываем текущее состояние миграций
    console.log('Current migration state:');
    const result = await client.query(`
      SELECT migration_name, finished_at, rolled_back_at, logs
      FROM "_prisma_migrations"
      WHERE migration_name = '20260109000003_update_consultations'
    `);

    if (result.rows.length === 0) {
      console.log('Migration record not found - it may have already been deleted or never existed.\n');
    } else {
      console.log(result.rows[0]);
      console.log('');
    }

    // Удаляем запись о failed миграции
    console.log('Deleting failed migration record...');
    const deleteResult = await client.query(`
      DELETE FROM "_prisma_migrations"
      WHERE "migration_name" = '20260109000003_update_consultations'
    `);

    console.log(`Deleted ${deleteResult.rowCount} row(s)`);
    console.log('\n✅ Done! Now redeploy your app on Railway.');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

fixMigration();
