import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbFile = path.join(__dirname, '../../data/gym_platform.db');
console.log('[DB Clean] Limpiando base de datos en:', dbFile);

const db = new Database(dbFile);
db.pragma('foreign_keys = OFF');

// 1. Limpiar todas las tablas de datos de prueba o demo
const tablesToClear = [
  'payments',
  'attendance',
  'calendar_event_attendees',
  'calendar_events',
  'content_releases',
  'routine_exercises',
  'routines',
  'exercises',
  'media_resources',
];

for (const table of tablesToClear) {
  try {
    const info = db.prepare(`DELETE FROM ${table}`).run();
    console.log(`[DB Clean] Tabla ${table}: ${info.changes} registros eliminados.`);
  } catch (err) {
    console.warn(`[DB Clean] Tabla ${table} no existe o no pudo limpiarse:`, err.message);
  }
}

// 2. Eliminar todos los usuarios que no sean administradores
const deleteStudents = db.prepare("DELETE FROM users WHERE role != 'ADMIN' AND id != 1").run();
console.log(`[DB Clean] Usuarios no administradores eliminados: ${deleteStudents.changes}`);

// 3. Crear o actualizar el usuario Administrador Augusto
const adminEmail = 'augusto@zgym.com';
const adminPassword = 'Augusto2026!';
const adminHash = bcrypt.hashSync(adminPassword, 10);
const now = new Date().toISOString();

const existingAdmin = db.prepare("SELECT id FROM users WHERE email = ? OR id = 1").get(adminEmail);

if (existingAdmin) {
  db.prepare(`
    UPDATE users SET
      first_name = 'Augusto',
      last_name = '',
      email = ?,
      password_hash = ?,
      role = 'ADMIN',
      phone = '',
      account_status = 'ACTIVO',
      goals = '',
      is_active = 1,
      is_presencial = 0,
      is_online = 1,
      updated_at = ?
    WHERE id = ?
  `).run(adminEmail, adminHash, now, existingAdmin.id);
  console.log(`[DB Clean] Usuario Administrador actualizado con éxito (ID: ${existingAdmin.id}): ${adminEmail}`);
} else {
  const insert = db.prepare(`
    INSERT INTO users (
      first_name, last_name, email, password_hash, role, phone,
      account_status, goals, is_active, is_presencial, is_online,
      created_at, updated_at
    ) VALUES (
      'Augusto', '', ?, ?, 'ADMIN', '',
      'ACTIVO', '', 1, 0, 1,
      ?, ?
    )
  `);
  const res = insert.run(adminEmail, adminHash, now, now);
  console.log(`[DB Clean] Usuario Administrador creado con éxito (ID: ${res.lastInsertRowid}): ${adminEmail}`);
}

// 4. Categorías base del sistema para ejercicios/videos
const categories = [
  { name: 'Fuerza e Hipertrofia', description: 'Ejercicios con sobrecarga para desarrollo muscular y fuerza máxima' },
  { name: 'Cardio & Resistencia', description: 'Entrenamientos aeróbicos, intervalos y capacidad de recuperación' },
  { name: 'Auditorías & Evaluaciones', description: 'Controles antropométricos periódicos y valoraciones técnicas' },
  { name: 'Movilidad & Core', description: 'Preparación articular, control postural y estabilidad del core' }
];

const insertCat = db.prepare('INSERT OR IGNORE INTO categories (name, description, created_at) VALUES (?, ?, ?)');
for (const cat of categories) {
  insertCat.run(cat.name, cat.description, now);
}

// Verificar estado final
const finalUsers = db.prepare("SELECT id, first_name, last_name, email, role, is_active FROM users").all();
console.log('[DB Clean] Usuarios finales en base de datos:', finalUsers);

const counts = {
  users: db.prepare("SELECT count(*) as c FROM users").get().c,
  payments: db.prepare("SELECT count(*) as c FROM payments").get().c,
  routines: db.prepare("SELECT count(*) as c FROM routines").get().c,
  exercises: db.prepare("SELECT count(*) as c FROM exercises").get().c,
  media: db.prepare("SELECT count(*) as c FROM media_resources").get().c,
  events: db.prepare("SELECT count(*) as c FROM calendar_events").get().c,
};
console.log('[DB Clean] Conteo de datos en el sistema:', counts);

db.pragma('foreign_keys = ON');
console.log('✅ Base de datos 100% limpia y Administrador Augusto listo.');
