import pkg from 'pg';
import { ENV } from './env.js';
import { executeSqlite, getSqliteDb } from '../database/sqliteDb.js';

const { Pool } = pkg;

let usePostgres = false;
let pool = null;

// Inicializar pool solo si se especificó una base de datos externa o URL
const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);
const hasExternalHost = Boolean(process.env.DB_HOST && process.env.DB_HOST !== 'localhost');
const forcePostgres = process.env.USE_POSTGRES === 'true';

if (hasDatabaseUrl || hasExternalHost || forcePostgres) {
  const isSslEnabled = process.env.DATABASE_SSL === 'true' || (hasDatabaseUrl && process.env.DATABASE_SSL !== 'false');

  const poolConfig = hasDatabaseUrl
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: isSslEnabled ? { rejectUnauthorized: false } : false,
      }
    : {
        host: ENV.DB.HOST,
        port: ENV.DB.PORT,
        user: ENV.DB.USER,
        password: ENV.DB.PASSWORD,
        database: ENV.DB.NAME,
        ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
      };

  pool = new Pool({
    ...poolConfig,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  pool.on('error', (err) => {
    console.error('[PostgreSQL] Error en el pool de conexiones:', err.message);
  });
}

export const query = async (text, params = []) => {
  if (usePostgres && pool) {
    try {
      return await pool.query(text, params);
    } catch (err) {
      console.error('[PostgreSQL] Error en consulta:', err.message);
      throw err;
    }
  }

  // Motor persistente SQLite en disco (server/src/database/gym_platform.db)
  return executeSqlite(text, params);
};

export const getClient = async () => {
  if (usePostgres && pool) {
    try {
      const client = await pool.connect();
      return client;
    } catch (err) {
      console.error('[PostgreSQL] Error al conectar cliente:', err.message);
      throw err;
    }
  }

  // Cliente SQLite para manejo de transacciones con BEGIN, COMMIT, ROLLBACK
  return {
    query: async (text, params = []) => executeSqlite(text, params),
    release: () => {},
  };
};

export const testConnection = async () => {
  if (pool) {
    try {
      const res = await pool.query('SELECT NOW() AS current_time');
      console.log(`⚡ [PostgreSQL / Supabase] Conexión activa a base de datos de producción: ${res.rows[0].current_time}`);
      usePostgres = true;

      // Verificar si existen las tablas unificadas en PostgreSQL; si no existen, inicializarlas automáticamente
      try {
        const tableCheck = await pool.query("SELECT to_regclass('public.users') as exists");
        if (!tableCheck.rows[0]?.exists) {
          console.log('[PostgreSQL / Supabase] Inicializando esquema unificado y políticas RLS...');
          const { runMigrations } = await import('../database/migrate.js');
          await runMigrations();
        }
      } catch (migErr) {
        console.warn('[PostgreSQL / Supabase] Verificación de migraciones:', migErr.message);
      }

      return true;
    } catch (error) {
      console.warn(`[PostgreSQL / Supabase] Conexión externa no disponible (${error.message}).`);
    }
  }

  // Inicializar SQLite persistente en disco
  getSqliteDb();
  console.log('⚡ [Database] Motor persistente SQLite activo en disco: server/data/gym_platform.db');
  console.log('⚡ [Database] Persistencia real garantizada: usuarios, rutinas, biblioteca y eventos se guardan permanentemente.');
  return true;
};

export default { query, getClient, testConnection };
