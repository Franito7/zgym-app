import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { query, testConnection } from '../config/db.js';

export const runSeeds = async () => {
  console.log('[Seeds] Iniciando carga de datos iniciales...');

  const connected = await testConnection();
  if (!connected) {
    console.error('[Seeds] No se pudo conectar a PostgreSQL. Verifica .env');
    process.exit(1);
  }

  // 1. Crear usuario Administrador inicial si no existe
  const adminEmail = 'augusto@zgym.com';
  const existingAdmin = await query('SELECT id FROM users WHERE email = $1', [adminEmail]);

  if (existingAdmin.rows.length === 0) {
    const passwordHash = await bcrypt.hash('Augusto2026!', 10);
    await query(
      `INSERT INTO users (first_name, last_name, email, password_hash, role, phone, is_active, is_presencial, is_online)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      ['Augusto', '', adminEmail, passwordHash, 'ADMIN', '', true, false, true]
    );
    console.log(`[Seeds] Usuario Administrador creado: ${adminEmail}`);
  } else {
    console.log(`[Seeds] El usuario Administrador ya existe: ${adminEmail}`);
  }

  // 2. Crear Categorías iniciales
  const categories = [
    { name: 'Fuerza e Hipertrofia', description: 'Ejercicios con sobrecarga para desarrollo muscular y fuerza' },
    { name: 'Cardio y Resistencia', description: 'Entrenamientos aeróbicos y metabólicos' },
    { name: 'Auditorías y Evaluaciones', description: 'Revisiones antropométricas y control de progreso mensual' },
    { name: 'Movilidad y Calentamiento', description: 'Rutinas de preparación articular y flexibilidad' },
  ];

  for (const cat of categories) {
    await query(
      `INSERT INTO categories (name, description)
       VALUES ($1, $2)
       ON CONFLICT (name) DO NOTHING`,
      [cat.name, cat.description]
    );
  }
  console.log('[Seeds] Categorías iniciales registradas.');
  console.log('[Seeds] Carga inicial de sistema completada con éxito.');

  console.log('[Seeds] Carga de datos iniciales finalizada con éxito.');
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runSeeds()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Seeds] Error al ejecutar seeds:', err);
      process.exit(1);
    });
}
