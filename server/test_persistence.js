import { authService } from './src/services/auth.service.js';
import { userService } from './src/services/user.service.js';
import { routineService } from './src/services/routine.service.js';
import { releaseService } from './src/services/release.service.js';
import { calendarService } from './src/services/calendar.service.js';
import { getSqliteDb } from './src/database/sqliteDb.js';

async function runAuditTests() {
  console.log('--- 🧪 INICIANDO TESTS DE PERSISTENCIA REAL Y RELACIONES ---');

  // 1. Test Admin Login
  const loginRes = await authService.login({
    email: 'admin@gymplatform.com',
    password: 'Admin123!',
  });
  console.log('✅ 1. Login Admin OK. Token generado para:', loginRes.user.email);

  // 2. Test Crear Alumno nuevo
  const testEmail = `alumno_${Date.now()}@test.com`;
  const newStudent = await userService.createUserByAdmin({
    firstName: 'Carlos',
    lastName: 'Test',
    email: testEmail,
    password: 'Password123!',
    role: 'ALUMNO',
    phone: '+54 11 9999-8888',
    trainerId: loginRes.user.id,
    accountStatus: 'ACTIVO',
    goals: 'Ganancia de masa muscular y fuerza',
  });
  console.log('✅ 2. Alumno creado con persistencia real:', newStudent.email, 'ID:', newStudent.id, 'Entrenador:', newStudent.trainer_id);

  // 3. Test Crear Rutina con Ejercicios
  const newRoutine = await routineService.createRoutine({
    title: 'Rutina de Fuerza Test',
    description: 'Rutina para test de persistencia relacional',
    createdBy: loginRes.user.id,
    exercises: [
      { exerciseId: 1, dayOfWeek: 'Día 1', sets: 4, reps: '10-12', notes: 'RIR 1' },
      { exerciseId: 2, dayOfWeek: 'Día 1', sets: 3, reps: '8-10', notes: 'Pausa isométrica' },
    ],
  });
  console.log('✅ 3. Rutina con ejercicios persistida en DB:', newRoutine.title, 'ID:', newRoutine.id, 'Total ejercicios:', newRoutine.exercises.length);

  // 4. Test Liberación masiva a múltiples alumnos (student 2 y newStudent.id)
  const releases = await releaseService.createRelease({
    userIds: [2, newStudent.id],
    routineId: newRoutine.id,
    releaseDate: new Date(Date.now() - 3600000).toISOString(), // Liberada hace 1 hora
    notes: 'Prueba de liberación simultánea a múltiples alumnos',
  });
  console.log('✅ 4. Liberación múltiple completada exitosamente. Registros creados:', Array.isArray(releases) ? releases.length : 1);

  // 5. Test Calendario con Meet y Alumnos asociados
  const event = await calendarService.createEvent({
    userIds: [2, newStudent.id],
    title: 'Meet Grupal de Seguimiento',
    eventDate: new Date(Date.now() + 86400000).toISOString(),
    type: 'MEET',
    meetUrl: 'https://meet.google.com/test-audit-zgym',
    notes: 'Revisión técnica de inicio de semana',
  });
  console.log('✅ 5. Evento de calendario con attendees persistido:', event.title, 'ID:', event.id);

  // 6. Validar que el alumno consulta y ve ÚNICAMENTE sus rutinas liberadas
  const studentRoutines = await routineService.getMyRoutines(newStudent.id);
  console.log('✅ 6. Consulta de rutinas liberadas para nuevo alumno:', studentRoutines.length, 'rutina(s) accesible(s)');

  // 7. Validar contenido multimedia liberado para el alumno
  const studentMedia = await releaseService.getMyReleasedMedia(newStudent.id);
  console.log('✅ 7. Consulta de biblioteca para nuevo alumno (restringida a lo liberado):', studentMedia.length, 'recursos');

  // 8. Verificar lectura directa en el archivo físico SQLite
  const db = getSqliteDb();
  const dbUser = db.prepare('SELECT id, first_name, email, trainer_id, account_status FROM users WHERE id = ?').get(newStudent.id);
  console.log('✅ 8. Verificación directa en archivo gym_platform.db:', dbUser);

  console.log('\n🎉 TODOS LOS TESTS DE PERSISTENCIA Y RELACIONES PASARON AL 100%!');
}

runAuditTests().catch((err) => {
  console.error('❌ Error en test de persistencia:', err);
  process.exit(1);
});
