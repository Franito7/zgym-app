import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
// Usamos service_role si está disponible en backend para saltar RLS de forma administrativa, o anon_key
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = () => {
  return Boolean(supabaseUrl && supabaseKey);
};

export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null;

export const SUPABASE_STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'zgym-media';

if (isSupabaseConfigured()) {
  console.log(`⚡ [Supabase] Cliente inicializado correctamente con URL: ${supabaseUrl}`);
} else {
  console.log('ℹ️ [Supabase] SUPABASE_URL / SUPABASE_KEY no detectados. Modo fallback local activo.');
}

export default supabase;
