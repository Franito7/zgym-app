import multer from 'multer';

// En entornos cloud y serverless (Vercel), el almacenamiento en memoria permite
// enviar el buffer directamente a Supabase Storage evitando archivos efímeros en disco.
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    // Videos
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'video/x-msvideo',
    'video/x-matroska',
    // PDFs
    'application/pdf',
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Tipo de archivo no permitido (${file.mimetype}). Solo se admiten videos (MP4, WebM, MOV) y PDFs.`), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 200 * 1024 * 1024, // 200 MB
  },
});
