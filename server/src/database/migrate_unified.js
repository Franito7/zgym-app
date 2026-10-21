import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, '../../data/gym_platform.db');

export function runUnifiedMigration() {
  const db = new Database(DB_FILE);
  db.pragma('foreign_keys = OFF');

  console.log('[Migration] Verificando esquema unificado ZGym...');

  // 1. Verificar columnas existentes en users
  const columns = db.prepare('PRAGMA table_info(users)').all();
  const colNames = columns.map(c => c.name);

  // Comprobar si email y password_hash son NOT NULL
  const emailCol = columns.find(c => c.name === 'email');
  const needsRecreation = emailCol && emailCol.notnull === 1;

  if (needsRecreation) {
    console.log('[Migration] Migrando tabla users para soportar clientes presenciales sin email obligatorio...');
    db.exec(`
      CREATE TABLE users_zgym (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        first_name TEXT NOT NULL,
        last_name TEXT DEFAULT '',
        email TEXT UNIQUE,
        password_hash TEXT,
        role TEXT NOT NULL DEFAULT 'ALUMNO',
        phone TEXT,
        trainer_id INTEGER REFERENCES users_zgym(id) ON DELETE SET NULL,
        account_status TEXT NOT NULL DEFAULT 'ACTIVO',
        goals TEXT,
        birth_date TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        is_presencial INTEGER NOT NULL DEFAULT 1,
        is_online INTEGER NOT NULL DEFAULT 0,
        plan_name TEXT DEFAULT 'Pase Libre',
        monthly_price REAL DEFAULT 0,
        due_date TEXT,
        schedule_days TEXT DEFAULT '[1,2,3,4,5]',
        schedule_time TEXT DEFAULT '09:00',
        enrollment_date TEXT,
        notes TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      INSERT INTO users_zgym (
        id, first_name, last_name, email, password_hash, role, phone,
        trainer_id, account_status, goals, birth_date, is_active,
        is_presencial, is_online, plan_name, monthly_price, due_date,
        schedule_days, schedule_time, enrollment_date, notes, created_at, updated_at
      )
      SELECT 
        id, first_name, last_name, email, password_hash, role, phone,
        trainer_id, account_status, goals, birth_date, is_active,
        0, 1, 'Plan Online', 0, NULL,
        '[]', '09:00', date('now'), '', created_at, updated_at
      FROM users;

      DROP TABLE users;
      ALTER TABLE users_zgym RENAME TO users;
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
      CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
    `);
    console.log('[Migration] Tabla users migrada con éxito.');
  } else {
    // Si ya existe la tabla, verificar si faltan columnas
    const neededCols = [
      { name: 'is_presencial', type: 'INTEGER DEFAULT 1' },
      { name: 'is_online', type: 'INTEGER DEFAULT 0' },
      { name: 'plan_name', type: "TEXT DEFAULT 'Pase Libre'" },
      { name: 'monthly_price', type: 'REAL DEFAULT 0' },
      { name: 'due_date', type: 'TEXT' },
      { name: 'schedule_days', type: "TEXT DEFAULT '[1,2,3,4,5]'" },
      { name: 'schedule_time', type: "TEXT DEFAULT '09:00'" },
      { name: 'enrollment_date', type: 'TEXT' },
      { name: 'notes', type: 'TEXT' }
    ];

    for (const col of neededCols) {
      if (!colNames.includes(col.name)) {
        console.log(`[Migration] Añadiendo columna ${col.name} a users...`);
        db.exec(`ALTER TABLE users ADD COLUMN ${col.name} ${col.type}`);
      }
    }
  }

  // 2. Crear tabla payments si no existe
  db.exec(`
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      amount REAL NOT NULL,
      payment_date TEXT NOT NULL,
      payment_method TEXT NOT NULL DEFAULT 'Efectivo',
      period TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'paid',
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
    CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date);

    CREATE TABLE IF NOT EXISTS gym_settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);

  db.pragma('foreign_keys = ON');
  console.log('[Migration] Esquema unificado ZGym listo y verificado.');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runUnifiedMigration();
}
