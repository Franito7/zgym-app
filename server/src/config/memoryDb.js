import bcrypt from 'bcryptjs';

// Base de datos en memoria para modo demostración / desarrollo local sin PostgreSQL activo
let isInitialized = false;

export const memoryStore = {
  users: [],
  categories: [],
  exercises: [],
  routines: [],
  routine_exercises: [],
  media_resources: [],
  content_releases: [],
  calendar_events: [],
  nextId: {
    users: 1,
    categories: 1,
    exercises: 1,
    routines: 1,
    routine_exercises: 1,
    media_resources: 1,
    content_releases: 1,
    calendar_events: 1,
  },
};

export const initMemoryStore = async () => {
  if (isInitialized) return;

  const adminHash = await bcrypt.hash('Admin123!', 10);
  const studentHash = await bcrypt.hash('Alumno123!', 10);

  // 1. Usuarios iniciales
  memoryStore.users = [
    {
      id: 1,
      first_name: 'Administrador',
      last_name: 'Principal',
      email: 'admin@gymplatform.com',
      password_hash: adminHash,
      role: 'ADMIN',
      phone: '+54 11 9876-5432',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 2,
      first_name: 'Juan',
      last_name: 'Pérez',
      email: 'alumno@gymplatform.com',
      password_hash: studentHash,
      role: 'ALUMNO',
      phone: '+54 11 1234-5678',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];
  memoryStore.nextId.users = 3;

  // 2. Categorías
  memoryStore.categories = [
    { id: 1, name: 'Fuerza e Hipertrofia', description: 'Ejercicios con sobrecarga para desarrollo muscular y fuerza', created_at: new Date().toISOString() },
    { id: 2, name: 'Cardio y Resistencia', description: 'Entrenamientos metabólicos y aeróbicos', created_at: new Date().toISOString() },
    { id: 3, name: 'Auditorías y Evaluaciones', description: 'Controles antropométricos y revisiones periódicas', created_at: new Date().toISOString() },
    { id: 4, name: 'Movilidad y Core', description: 'Calentamiento articular, estiramientos y zona media', created_at: new Date().toISOString() },
  ];
  memoryStore.nextId.categories = 5;

  // 3. Ejercicios
  memoryStore.exercises = [
    {
      id: 1,
      category_id: 1,
      title: 'Sentadilla Libre con Barra',
      description: 'Pies al ancho de hombros, torso firme y descenso controlado rompiendo el paralelo.',
      video_url: 'https://www.youtube.com/watch?v=aclHkVaku9U',
      created_at: new Date().toISOString(),
    },
    {
      id: 2,
      category_id: 1,
      title: 'Press de Banca Plano',
      description: 'Retracción escapular, pies apoyados en el suelo y trayectoria diagonal de la barra.',
      video_url: 'https://www.youtube.com/watch?v=rT7DgCr-3pg',
      created_at: new Date().toISOString(),
    },
    {
      id: 3,
      category_id: 1,
      title: 'Peso Muerto Rumano',
      description: 'Foco en isquiosurales y glúteos, empujando la cadera hacia atrás manteniendo espalda neutra.',
      video_url: 'https://www.youtube.com/watch?v=JCXUYuzwNrM',
      created_at: new Date().toISOString(),
    },
    {
      id: 4,
      category_id: 4,
      title: 'Plancha Abdominal Isometrica',
      description: 'Activar transverso abdominal y glúteos sin arquear la zona lumbar.',
      video_url: 'https://www.youtube.com/watch?v=ASdvN_XEl_c',
      created_at: new Date().toISOString(),
    },
  ];
  memoryStore.nextId.exercises = 5;

  // 4. Rutinas
  memoryStore.routines = [
    {
      id: 1,
      title: 'Fase 1: Acondicionamiento & Fuerza Base',
      description: 'Rutina de 3 días para consolidar técnica y adaptación neuromuscular.',
      created_by: 1,
      created_at: new Date().toISOString(),
    },
  ];
  memoryStore.nextId.routines = 2;

  memoryStore.routine_exercises = [
    { id: 1, routine_id: 1, exercise_id: 1, day_of_week: 'Lunes', sets: 4, reps: '10-12', notes: 'RIR 2, descanso 90s', order_index: 1 },
    { id: 2, routine_id: 1, exercise_id: 2, day_of_week: 'Lunes', sets: 4, reps: '8-10', notes: 'Descanso 2 min', order_index: 2 },
    { id: 3, routine_id: 1, exercise_id: 3, day_of_week: 'Miércoles', sets: 3, reps: '10-12', notes: 'Técnica estricta', order_index: 1 },
    { id: 4, routine_id: 1, exercise_id: 4, day_of_week: 'Miércoles', sets: 3, reps: '45s', notes: 'Concentración en abdomen', order_index: 2 },
  ];
  memoryStore.nextId.routine_exercises = 5;

  // 5. Recursos Multimedia (Videos y PDFs)
  memoryStore.media_resources = [
    {
      id: 1,
      title: 'Guía de Auditoría Antropométrica Mensual',
      description: 'Documento en PDF explicando cómo tomar las medidas corporales y fotografías de control.',
      type: 'PDF',
      url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      file_size_bytes: 1048576,
      category_id: 3,
      created_at: new Date().toISOString(),
    },
    {
      id: 2,
      title: 'Técnica y Biomecánica de Sentadilla Profunda',
      description: 'Masterclass en video sobre movilidad de tobillo y posicionamiento de cadera.',
      type: 'VIDEO',
      url: 'https://www.youtube.com/watch?v=aclHkVaku9U',
      file_size_bytes: null,
      category_id: 1,
      created_at: new Date().toISOString(),
    },
  ];
  memoryStore.nextId.media_resources = 3;

  // 6. Contenidos Liberados (para el alumno id: 2)
  memoryStore.content_releases = [
    {
      id: 1,
      user_id: 2,
      routine_id: 1,
      media_resource_id: null,
      release_date: new Date(Date.now() - 86400000).toISOString(), // Liberado ayer
      is_active: true,
      notes: 'Primera fase asignada. Enfocarse en la técnica.',
      created_at: new Date().toISOString(),
    },
    {
      id: 2,
      user_id: 2,
      routine_id: null,
      media_resource_id: 1,
      release_date: new Date(Date.now() - 86400000).toISOString(), // Liberado ayer
      is_active: true,
      notes: 'Informe de auditoría inicial.',
      created_at: new Date().toISOString(),
    },
    {
      id: 3,
      user_id: 2,
      routine_id: null,
      media_resource_id: 2,
      release_date: new Date(Date.now() - 86400000).toISOString(),
      is_active: true,
      notes: 'Video técnico obligatorio.',
      created_at: new Date().toISOString(),
    },
  ];
  memoryStore.nextId.content_releases = 4;

  // 7. Eventos de Calendario (Auditorías programadas)
  memoryStore.calendar_events = [
    {
      id: 1,
      user_id: 2,
      title: 'Auditoría Online - Revisión de Composición Corporal',
      event_date: new Date(Date.now() + 86400000 * 3).toISOString(), // En 3 días
      type: 'AUDITORIA',
      status: 'PENDIENTE',
      notes: 'Revisión por videollamada de las fotos y medidas enviadas.',
      created_at: new Date().toISOString(),
    },
    {
      id: 2,
      user_id: 2,
      title: 'Sesión de Fuerza: Tren Superior',
      event_date: new Date(Date.now() + 86400000).toISOString(), // Mañana
      type: 'ENTRENAMIENTO',
      status: 'PENDIENTE',
      notes: 'Completar rutina de Día 1',
      created_at: new Date().toISOString(),
    },
  ];
  memoryStore.nextId.calendar_events = 3;

  isInitialized = true;
};
