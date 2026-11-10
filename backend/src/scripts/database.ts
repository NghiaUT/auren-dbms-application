import { readFile } from 'node:fs/promises';
import mysql, { type Connection, type RowDataPacket } from 'mysql2/promise';
import { env } from '../config/env.js';

const sqlFile = (name: string) => readFile(new URL(`../../../database/${name}`, import.meta.url), 'utf8');

async function applySchema(conn: Connection) {
  const schema = await sqlFile('schema.sql');
  const database = conn.escapeId(env.DB_NAME);
  await conn.query(schema
    .replace('CREATE DATABASE IF NOT EXISTS luxury_furniture', `CREATE DATABASE IF NOT EXISTS ${database}`)
    .replace('USE luxury_furniture;', `USE ${database};`));

  const [columns] = await conn.query<RowDataPacket[]>("SHOW COLUMNS FROM users LIKE 'is_active'");
  if (!columns.length) {
    await conn.query('ALTER TABLE users ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE');
  }
}

async function manageIndexes(conn: Connection, action: string) {
  const script = await sqlFile('indexes.sql');
  const [production, demo] = script.split('-- BEGIN DEMO INDEXES');
  if (!demo) throw new Error('indexes.sql is missing its demo index section');
  const [rows] = await conn.execute<RowDataPacket[]>(
    `SELECT TABLE_NAME, INDEX_NAME, INDEX_TYPE, IS_VISIBLE
       FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = ? AND SEQ_IN_INDEX = 1
      ORDER BY TABLE_NAME, INDEX_NAME`,
    [env.DB_NAME],
  );
  if (action === 'status') {
    console.table(rows);
    return;
  }

  for (const statement of (action === 'drop' ? demo : production + demo).split(/\r?\n/)) {
    const sql = statement.trim();
    if (!sql || sql.startsWith('--')) continue;
    const match = /^CREATE (?:FULLTEXT )?INDEX (\w+) ON (\w+) \([\w, ]+\);$/.exec(sql);
    if (!match) throw new Error(`Unsupported statement in indexes.sql: ${sql}`);
    const [, name, table] = match;
    const existing = rows.find((row) => row.TABLE_NAME === table && row.INDEX_NAME === name);
    if (action === 'drop') {
      if (existing) await conn.query(`DROP INDEX ${name} ON ${table}`);
    } else if (!existing) {
      await conn.query(sql);
    } else if (existing.IS_VISIBLE === 'NO') {
      await conn.query(`ALTER TABLE ${table} ALTER INDEX ${name} VISIBLE`);
    }
  }
}

async function main() {
  const action = process.argv[2];
  if (!['init', 'apply', 'drop', 'status'].includes(action)) throw new Error('Use init, apply, drop or status');
  const conn = await mysql.createConnection({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASS,
    database: action === 'init' ? undefined : env.DB_NAME,
    multipleStatements: action === 'init',
  });
  try {
    const [locks] = await conn.execute<RowDataPacket[]>(
      'SELECT GET_LOCK(SHA2(?, 256), 30) AS acquired',
      [`${env.DB_NAME}:schema`],
    );
    if (locks[0].acquired !== 1) throw new Error('Timed out waiting for the schema/index lock');
    if (action === 'init') await applySchema(conn);
    await manageIndexes(conn, action);
    console.log(`Database ${env.DB_NAME}: ${action} complete`);
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error(`Database ${process.argv[2]} failed: ${err.message}`);
  process.exitCode = 1;
});
