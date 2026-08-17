// One-shot setup: creates the database, tables, and demo data.
// Run with: npm run db:init
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
  });

  try {
    const schemaSql = fs.readFileSync(path.join(__dirname, '..', 'db', 'schema.sql'), 'utf8');
    console.log('Creating database & tables...');
    await connection.query(schemaSql);

    const seedSql = fs.readFileSync(path.join(__dirname, '..', 'db', 'seed.sql'), 'utf8');
    console.log('Loading demo data...');
    await connection.query(seedSql);

    console.log('Database ready: hotel_reservation_system');
  } catch (err) {
    console.error('Database setup failed:', err.message);
    process.exitCode = 1;
  } finally {
    await connection.end();
  }
}

run();
