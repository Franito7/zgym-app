import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { query, testConnection } from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const runMigrations = async () => {
  console.log('[Migraciones] Iniciando proceso de migración...');
  
  const connected = await testConnection();
  if (!connected) {
    console.error('[Migraciones] No se pudo conectar a PostgreSQL. Verifica las variables de entorno en .env');
    process.exit(1);
  }

  const migrationsDir = path.join(__dirname, 'migrations');
  const files = await fs.readdir(migrationsDir);
  const sqlFiles = files.filter(f => f.endsWith('.sql')).sort();

  for (const file of sqlFiles) {
    const filePath = path.join(migrationsDir, file);
    console.log(`[Migraciones] Ejecutando: ${file}`);
    const sql = await fs.readFile(filePath, 'utf-8');
    await query(sql);
    console.log(`[Migraciones] Completado: ${file}`);
  }

  console.log('[Migraciones] Todas las migraciones se ejecutaron correctamente.');
};

// Si se ejecuta directamente desde la línea de comandos
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runMigrations()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Migraciones] Error fatal:', err);
      process.exit(1);
    });
}
