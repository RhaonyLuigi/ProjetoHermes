import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { randomUUID } from 'node:crypto';

export const now = () => new Date().toISOString();
export const id = randomUUID;

export function openDatabase(path = process.env.DATABASE_PATH || './data/hermes.sqlite') {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
  const sqlite = new DatabaseSync(path);
  sqlite.exec('PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000; PRAGMA journal_mode = WAL; PRAGMA synchronous = FULL;');
  const db = {
    get: (sql, ...params) => sqlite.prepare(sql).get(...params),
    all: (sql, ...params) => sqlite.prepare(sql).all(...params),
    run: (sql, ...params) => sqlite.prepare(sql).run(...params),
    tx(operation) {
      sqlite.exec('BEGIN IMMEDIATE');
      try {
        const result = operation();
        sqlite.exec('COMMIT');
        return result;
      } catch (error) {
        sqlite.exec('ROLLBACK');
        throw error;
      }
    },
    backup: async (target) => {
      const { backup } = await import('node:sqlite');
      await backup(sqlite, target);
    },
    close: () => sqlite.close()
  };
  db.tx(() => {
    const version = db.get('PRAGMA user_version').user_version;
    if (version > 2) throw new Error('Versão do banco incompatível com este servidor.');
    if (version === 0) {
      sqlite.exec(readFileSync(new URL('./schema.sql', import.meta.url), 'utf8'));
    }
    if (version < 2) {
      sqlite.exec(`CREATE TABLE auditoria (
        id TEXT PRIMARY KEY, admin_id TEXT NOT NULL REFERENCES usuarios(id), acao TEXT NOT NULL,
        alvo TEXT NOT NULL, decisao TEXT NOT NULL, criado_em TEXT NOT NULL
      ); PRAGMA user_version = 2;`);
    }
  });
  return db;
}
