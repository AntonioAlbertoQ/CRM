/* Conexão SQLite local; DB_PATH permite apontar para outro arquivo no ambiente. */
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, isAbsolute, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const backendDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const defaultDatabasePath = resolve(backendDirectory, 'data', 'crm.sqlite');
const configuredDatabasePath = process.env.DB_PATH || defaultDatabasePath;
const databasePath = isAbsolute(configuredDatabasePath)
    ? configuredDatabasePath
    : resolve(process.cwd(), configuredDatabasePath);

mkdirSync(dirname(databasePath), { recursive: true });

export const database = new DatabaseSync(databasePath);
database.exec('PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000; PRAGMA journal_mode = WAL;');
database.exec(readFileSync(new URL('./schema.sql', import.meta.url), 'utf8'));
