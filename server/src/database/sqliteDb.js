import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { runUnifiedMigration } from './migrate_unified.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../../data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
const DB_FILE = path.join(DATA_DIR, 'gym_platform.db');

let dbInstance = null;

export const getSqliteDb = () => {
  if (!dbInstance) {
    dbInstance = new Database(DB_FILE);
    dbInstance.pragma('foreign_keys = ON');
    dbInstance.pragma('journal_mode = WAL');

    // Funciones personalizadas
    dbInstance.function('NOW', () => new Date().toISOString());
    dbInstance.function('is_past_or_now', (dateStr) => {
      if (!dateStr) return 1;
      return new Date(dateStr) <= new Date() ? 1 : 0;
    });

    initializeSchema(dbInstance);
    runUnifiedMigration();
  }
  return dbInstance;
};

const initializeSchema = (db) => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'ALUMNO',
      phone TEXT,
      trainer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      account_status TEXT NOT NULL DEFAULT 'ACTIVO',
      goals TEXT,
      birth_date TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS exercises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      description TEXT,
      video_url TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS routines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS routine_exercises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      routine_id INTEGER NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
      exercise_id INTEGER NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
      day_of_week TEXT NOT NULL,
      sets INTEGER NOT NULL,
      reps TEXT NOT NULL,
      notes TEXT,
      order_index INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS media_resources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      type TEXT NOT NULL CHECK (type IN ('VIDEO', 'PDF')),
      url TEXT NOT NULL,
      file_size_bytes INTEGER,
      category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS content_releases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      media_resource_id INTEGER REFERENCES media_resources(id) ON DELETE SET NULL,
      routine_id INTEGER REFERENCES routines(id) ON DELETE SET NULL,
      release_date TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS calendar_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      event_date TEXT NOT NULL,
      type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDIENTE',
      notes TEXT,
      meet_url TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS calendar_event_attendees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    CREATE INDEX IF NOT EXISTS idx_routine_exercises_routine ON routine_exercises(routine_id);
    CREATE INDEX IF NOT EXISTS idx_content_releases_user ON content_releases(user_id);
    CREATE INDEX IF NOT EXISTS idx_calendar_user ON calendar_events(user_id);
  `);

  // Seed inicial si la tabla users está vacía
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount === 0) {
    seedInitialData(db);
  }
};

const seedInitialData = (db) => {
  const adminHash = bcrypt.hashSync('Augusto2026!', 10);
  const now = new Date().toISOString();

  // 1. Usuario Coach / Administrador Principal
  const insertUser = db.prepare(`
    INSERT INTO users (first_name, last_name, email, password_hash, role, phone, account_status, goals, is_active, is_presencial, is_online, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 0, 1, ?, ?)
  `);

  insertUser.run(
    'Augusto',
    '',
    'augusto@zgym.com',
    adminHash,
    'ADMIN',
    '',
    'ACTIVO',
    'Administración integral ZGym',
    now,
    now
  );

  // 2. Categorías estructurales del sistema
  const insertCat = db.prepare('INSERT INTO categories (name, description, created_at) VALUES (?, ?, ?)');
  insertCat.run('Fuerza e Hipertrofia', 'Ejercicios con sobrecarga para desarrollo muscular y fuerza máxima', now);
  insertCat.run('Cardio & Resistencia', 'Entrenamientos aeróbicos, intervalos y capacidad de recuperación', now);
  insertCat.run('Auditorías & Evaluaciones', 'Controles antropométricos periódicos y valoraciones técnicas', now);
  insertCat.run('Movilidad & Core', 'Preparación articular, control postural y estabilidad del core', now);
};

// Conversor de SQL de PostgreSQL a SQLite
export const transformPostgresSqlToSqlite = (sql, params = []) => {
  let transformed = sql;
  const mappedParams = [];

  // 1. Re-mapear $1, $2, ... a ? en el orden en que aparecen y duplicar valores si $1 aparece más de una vez
  const hasNumberedPlaceholders = /\$\d+/.test(transformed);
  if (hasNumberedPlaceholders) {
    transformed = transformed.replace(/\$(\d+)/g, (match, num) => {
      const idx = parseInt(num, 10) - 1;
      if (idx >= 0 && idx < params.length) {
        mappedParams.push(params[idx]);
      }
      return '?';
    });
  }

  // 2. Eliminar casts de tipo de Postgres ::int, ::text, etc.
  transformed = transformed.replace(/::[a-zA-Z_]+/g, '');

  // 3. Reemplazar ILIKE con LIKE (SQLite LIKE es case-insensitive)
  transformed = transformed.replace(/\bILIKE\b/gi, 'LIKE');

  // 4. Fechas: CURRENT_TIMESTAMP en comparaciones con o sin alias de tabla
  transformed = transformed.replace(/([a-zA-Z0-9_]+\.)?release_date\s*<=\s*CURRENT_TIMESTAMP/gi, (match, prefix) => {
    return `datetime(${prefix || ''}release_date) <= datetime('now')`;
  });

  transformed = transformed.replace(/([a-zA-Z0-9_]+\.)?event_date\s*>=\s*CURRENT_TIMESTAMP/gi, (match, prefix) => {
    return `datetime(${prefix || ''}event_date) >= datetime('now')`;
  });

  return {
    sql: transformed,
    params: hasNumberedPlaceholders ? mappedParams : params,
  };
};

// Ejecución estándar compatible con pg (query retorna { rows, rowCount })
export const executeSqlite = (sql, params = []) => {
  const db = getSqliteDb();
  const { sql: convertedSql, params: finalParams } = transformPostgresSqlToSqlite(sql, params);
  const trimmed = convertedSql.trim();

  // Si es un comando de transacción
  if (/^BEGIN\b/i.test(trimmed)) {
    // Si ya hay una transacción activa, ignorar
    if (!db.inTransaction) {
      db.exec('BEGIN');
    }
    return { rows: [], rowCount: 0 };
  }
  if (/^COMMIT\b/i.test(trimmed)) {
    if (db.inTransaction) {
      db.exec('COMMIT');
    }
    return { rows: [], rowCount: 0 };
  }
  if (/^ROLLBACK\b/i.test(trimmed)) {
    if (db.inTransaction) {
      db.exec('ROLLBACK');
    }
    return { rows: [], rowCount: 0 };
  }

  // Sanitizar booleanos a 1 o 0 para SQLite
  const cleanParams = finalParams.map((p) => {
    if (typeof p === 'boolean') return p ? 1 : 0;
    return p;
  });

  const stmt = db.prepare(convertedSql);

  // Si tiene RETURNING o es SELECT, usar stmt.all()
  if (/RETURNING\b/i.test(trimmed) || /^SELECT\b/i.test(trimmed)) {
    const rows = stmt.all(...cleanParams);
    return { rows, rowCount: rows.length };
  }

  // De lo contrario (INSERT / UPDATE / DELETE sin RETURNING)
  const info = stmt.run(...cleanParams);
  return { rows: [], rowCount: info.changes };
};
