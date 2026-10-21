import { supabase, isSupabaseConfigured, SUPABASE_STORAGE_BUCKET } from '../config/supabase.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOCAL_UPLOADS_DIR = path.join(__dirname, '../../uploads');

export const supabaseStorageService = {
  /**
   * Sube un archivo a Supabase Storage con fallback local en disco.
   * @param {Object} file Objeto file provisto por Multer (con .buffer, .originalname, .mimetype, .size)
   * @param {Object} req Request express para fallback de URL local
   * @returns {Promise<{ url: string, filename: string, size: number, mimetype: string, storageType: 'SUPABASE' | 'LOCAL' }>}
   */
  async uploadFile(file, req) {
    if (!file || !file.buffer) {
      throw new Error('No se recibió el buffer de datos del archivo.');
    }

    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const sanitizedName = (file.originalname || 'archivo').replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${uniqueSuffix}-${sanitizedName}`;

    // 1. Si Supabase está configurado: Subir a Supabase Storage
    if (isSupabaseConfigured() && supabase) {
      try {
        const bucket = SUPABASE_STORAGE_BUCKET;

        // Intentar asegurar existencia del bucket (idempotente)
        try {
          const { data: buckets } = await supabase.storage.listBuckets();
          const bucketExists = buckets?.some(b => b.name === bucket);
          if (!bucketExists) {
            await supabase.storage.createBucket(bucket, {
              public: true,
              fileSizeLimit: 200 * 1024 * 1024, // 200 MB
            });
            console.log(`[Supabase Storage] Bucket "${bucket}" creado exitosamente.`);
          }
        } catch (bucketErr) {
          // Si no tiene permisos de crear bucket, continuar al upload
          console.warn('[Supabase Storage] Verificación de bucket omitida:', bucketErr.message);
        }

        // Subir buffer a Supabase
        const { data, error } = await supabase.storage
          .from(bucket)
          .upload(fileName, file.buffer, {
            contentType: file.mimetype,
            upsert: true,
          });

        if (error) {
          throw error;
        }

        // Obtener URL pública permanente
        const { data: publicUrlData } = supabase.storage
          .from(bucket)
          .getPublicUrl(fileName);

        const permanentUrl = publicUrlData.publicUrl;
        console.log(`✓ [Supabase Storage] Archivo subido con éxito: ${permanentUrl}`);

        return {
          url: permanentUrl,
          filename: fileName,
          originalName: file.originalname,
          size: file.size,
          mimetype: file.mimetype,
          storageType: 'SUPABASE',
        };
      } catch (supabaseError) {
        console.error('⚠️ [Supabase Storage] Error al subir a Supabase. Activando fallback local:', supabaseError.message);
      }
    }

    // 2. Fallback Local en disco (modo offline)
    if (!fs.existsSync(LOCAL_UPLOADS_DIR)) {
      fs.mkdirSync(LOCAL_UPLOADS_DIR, { recursive: true });
    }
    const localFilePath = path.join(LOCAL_UPLOADS_DIR, fileName);
    fs.writeFileSync(localFilePath, file.buffer);

    const protocol = req.protocol || 'http';
    const host = req.get('host') || 'localhost:5000';
    const localUrl = `${protocol}://${host}/uploads/${fileName}`;

    console.log(`ℹ️ [LocalStorage] Archivo guardado localmente en disco: ${localFilePath}`);

    return {
      url: localUrl,
      filename: fileName,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      storageType: 'LOCAL',
    };
  },
};

export default supabaseStorageService;
