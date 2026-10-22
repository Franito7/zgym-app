import { supabase, isSupabaseConfigured, SUPABASE_STORAGE_BUCKET } from './supabase';
import { User, Payment, Routine, Exercise, Category, MediaResource, ContentRelease, CalendarEvent, DashboardStats } from '../types';

// ==============================================================================
// MODO FALLBACK LOCAL STORAGE (Garantiza funcionamiento offline/preview sin romper nada)
// ==============================================================================
const STORAGE_PREFIX = 'zgym_db_';

function getLocalTable<T>(table: string): T[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${table}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setLocalTable<T>(table: string, data: T[]): void {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${table}`, JSON.stringify(data));
  } catch (err) {
    console.error('Error guardando en fallback local:', err);
  }
}

// Inicialización de datos esenciales del administrador Augusto en caso de modo offline
export function initLocalFallbackDB(): void {
  const users = getLocalTable<User>('users');
  if (users.length === 0) {
    const adminUser: User = {
      id: 1,
      first_name: 'Augusto',
      last_name: '',
      email: 'augusto@zgym.com',
      role: 'ADMIN',
      phone: '',
      account_status: 'ACTIVO',
      is_active: 1,
      is_presencial: 0,
      is_online: 1,
      plan_name: 'Administrador',
      monthly_price: 0,
      schedule_time: '12:00',
      schedule_days: [1, 2, 3, 4, 5],
      notes: 'Administrador General ZGym',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setLocalTable('users', [adminUser]);

    const categories: Category[] = [
      { id: 1, name: 'Fuerza e Hipertrofia', description: 'Ejercicios con sobrecarga', created_at: new Date().toISOString() },
      { id: 2, name: 'Cardio & Resistencia', description: 'Entrenamientos aeróbicos', created_at: new Date().toISOString() },
      { id: 3, name: 'Auditorías & Evaluaciones', description: 'Controles antropométricos', created_at: new Date().toISOString() },
      { id: 4, name: 'Movilidad & Core', description: 'Preparación articular y postura', created_at: new Date().toISOString() },
    ];
    setLocalTable('categories', categories);
  }
}

initLocalFallbackDB();

// ==============================================================================
// 1. AUTENTICACIÓN (SUPABASE AUTH + FALLBACK)
// ==============================================================================
export const authService = {
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const cleanEmail = email.toLowerCase().trim();

    if (isSupabaseConfigured()) {
      // 1. Intentar inicio de sesión vía Supabase Auth
      let { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      // Si falla por credenciales inválidas y es el usuario administrador Augusto, intentamos registro automático inicial
      if (authError && (authError.message.includes('Invalid login') || authError.message.includes('not found') || authError.message.includes('credentials'))) {
        if (cleanEmail === 'augusto@zgym.com' && password === 'Augusto2026!') {
          const signUpRes = await supabase.auth.signUp({
            email: cleanEmail,
            password,
            options: {
              data: {
                first_name: 'Augusto',
                role: 'ADMIN',
              },
            },
          });
          if (signUpRes.data?.session) {
            authData = signUpRes.data;
            authError = null;
          }
        }
      }

      if (authError) {
        throw new Error(
          authError.message === 'Invalid login credentials'
            ? 'Credenciales inválidas. Verificá tu correo y contraseña.'
            : authError.message
        );
      }

      const token = authData?.session?.access_token || '';

      // 2. Obtener o sincronizar perfil de usuario en tabla pública `users`
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (profile) {
        return { user: profile, token };
      }

      // Si no existe perfil en la tabla users, crearlo a partir de los datos de Auth
      const isAugusto = cleanEmail === 'augusto@zgym.com';
      const newUser: Partial<User> = {
        first_name: isAugusto ? 'Augusto' : cleanEmail.split('@')[0],
        last_name: '',
        email: cleanEmail,
        role: isAugusto ? 'ADMIN' : 'ALUMNO',
        account_status: 'ACTIVO',
        is_active: 1,
        is_presencial: isAugusto ? 0 : 1,
        is_online: 1,
        plan_name: isAugusto ? 'Administrador' : 'Pase Libre',
        monthly_price: 0,
        schedule_time: '12:00',
        schedule_days: [1, 2, 3, 4, 5],
        notes: isAugusto ? 'Usuario Administrador Oficial ZGym' : '',
      };

      const { data: createdProfile, error: insertError } = await supabase
        .from('users')
        .insert([newUser])
        .select('*')
        .single();

      if (insertError) {
        console.error('Error insertando perfil en users:', insertError);
      }

      return { user: createdProfile || (newUser as User), token };
    }

    // Modo local / preview fallback si no hay credenciales de Supabase
    const users = getLocalTable<User>('users');
    const found = users.find((u) => u.email?.toLowerCase() === cleanEmail);

    if (found) {
      if (cleanEmail === 'augusto@zgym.com' && password !== 'Augusto2026!') {
        throw new Error('Credenciales inválidas.');
      }
      return { user: found, token: `local_session_${found.id}` };
    }

    // Si es augusto y no estaba en tabla local
    if (cleanEmail === 'augusto@zgym.com' && password === 'Augusto2026!') {
      const admin: User = {
        id: 1,
        first_name: 'Augusto',
        last_name: '',
        email: 'augusto@zgym.com',
        phone: '',
        role: 'ADMIN',
        account_status: 'ACTIVO',
        is_active: 1,
        is_presencial: 0,
        is_online: 1,
        plan_name: 'Administrador',
        monthly_price: 0,
        schedule_time: '12:00',
        schedule_days: [1, 2, 3, 4, 5],
        notes: 'Administrador General ZGym',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setLocalTable('users', [admin]);
      return { user: admin, token: 'local_session_1' };
    }

    throw new Error('Credenciales inválidas.');
  },

  async logout(): Promise<void> {
    if (isSupabaseConfigured()) {
      await supabase.auth.signOut();
    }
  },

  async getMe(currentUserId?: number): Promise<User | null> {
    if (isSupabaseConfigured()) {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user?.email) return null;

      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('email', authData.user.email.toLowerCase())
        .maybeSingle();

      return profile || null;
    }

    const users = getLocalTable<User>('users');
    if (currentUserId) {
      return users.find((u) => u.id === currentUserId) || null;
    }
    return users.find((u) => u.email === 'augusto@zgym.com') || null;
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    if (isSupabaseConfigured()) {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw new Error(error.message);
    }
  },
};

// ==============================================================================
// 2. CLIENTES / ALUMNOS (SUPABASE DATABASE)
// ==============================================================================
export const clientsService = {
  async getAll(filters?: { search?: string; status?: string; type?: string; role?: string }): Promise<User[]> {
    if (isSupabaseConfigured()) {
      try {
        let query = supabase.from('users').select('*');

        if (filters?.role) {
          query = query.eq('role', filters.role);
        }
        if (filters?.status && filters.status !== 'all') {
          query = query.eq('account_status', filters.status);
        }
        if (filters?.type === 'presencial') {
          query = query.eq('is_presencial', 1);
        } else if (filters?.type === 'online') {
          query = query.eq('is_online', 1);
        } else if (filters?.type === 'hybrid') {
          query = query.eq('is_presencial', 1).eq('is_online', 1);
        }
        if (filters?.search) {
          query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`);
        }

        const { data, error } = await query.order('first_name', { ascending: true });
        if (error) {
          console.error('Error al consultar tabla users en Supabase:', error.message);
          return [];
        }
        return data || [];
      } catch (err: any) {
        console.error('Error inesperado en clientsService.getAll:', err?.message || err);
        return [];
      }
    }

    // Fallback local
    let list = getLocalTable<User>('users').filter((u) => u.role === 'ALUMNO' && u.is_active);

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter((u) =>
        u.first_name.toLowerCase().includes(q) ||
        (u.last_name && u.last_name.toLowerCase().includes(q)) ||
        (u.phone && u.phone.includes(q))
      );
    }
    if (filters?.status && filters.status !== 'all') {
      list = list.filter((u) => u.account_status === filters.status);
    }
    if (filters?.type === 'presencial') {
      list = list.filter((u) => u.is_presencial);
    } else if (filters?.type === 'online') {
      list = list.filter((u) => u.is_online);
    } else if (filters?.type === 'hybrid') {
      list = list.filter((u) => u.is_presencial && u.is_online);
    }
    return list;
  },

  async getById(id: number): Promise<User> {
    if (isSupabaseConfigured()) {
      const { data: user, error } = await supabase.from('users').select('*').eq('id', id).single();
      if (error) throw new Error(error.message);

      // Obtener pagos
      const { data: payments } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', id)
        .order('payment_date', { ascending: false });

      // Obtener rutinas liberadas
      const { data: releases } = await supabase
        .from('content_releases')
        .select('*, routine:routines(*), media:media_resources(*)')
        .eq('user_id', id)
        .order('release_date', { ascending: false });

      return {
        ...user,
        payments: payments || [],
        releases: releases || [],
      };
    }

    const users = getLocalTable<User>('users');
    const user = users.find((u) => u.id === id);
    if (!user) throw new Error('Alumno no encontrado.');

    const payments = getLocalTable<Payment>('payments').filter((p) => p.user_id === id);
    const releases = getLocalTable<ContentRelease>('content_releases').filter((r) => r.user_id === id);
    return { ...user, payments, releases };
  },

  async create(clientData: any): Promise<User> {
    const formattedData = {
      first_name: clientData.firstName || clientData.first_name,
      last_name: clientData.lastName !== undefined ? clientData.lastName : (clientData.last_name || ''),
      email: clientData.email?.trim() || null,
      phone: clientData.phone?.trim() || null,
      role: clientData.role || 'ALUMNO',
      account_status: 'ACTIVO',
      is_active: 1,
      is_presencial: clientData.isPresencial !== undefined ? (clientData.isPresencial ? 1 : 0) : (clientData.is_presencial ? 1 : 0),
      is_online: clientData.isOnline !== undefined ? (clientData.isOnline ? 1 : 0) : (clientData.is_online ? 1 : 0),
      plan_name: clientData.planName || clientData.plan_name || 'Pase Libre',
      monthly_price: Number(clientData.monthlyPrice !== undefined ? clientData.monthlyPrice : clientData.monthly_price) || 0,
      due_date: clientData.dueDate || clientData.due_date || null,
      schedule_time: clientData.scheduleTime || clientData.schedule_time || '12:00',
      schedule_days: Array.isArray(clientData.scheduleDays) ? clientData.scheduleDays : [1, 2, 3, 4, 5],
      notes: clientData.notes || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      // 1. Si es alumno online y tiene email, registrar también en Supabase Auth si corresponde
      if (formattedData.is_online && formattedData.email && clientData.password) {
        try {
          await supabase.auth.signUp({
            email: formattedData.email,
            password: clientData.password,
            options: {
              data: {
                first_name: formattedData.first_name,
                role: 'ALUMNO',
              },
            },
          });
        } catch (authErr) {
          console.warn('Usuario auth ya existe o no pudo crearse:', authErr);
        }
      }

      const { data, error } = await supabase.from('users').insert(formattedData).select().single();
      if (error) throw new Error(error.message);
      return data;
    }

    const users = getLocalTable<User>('users');
    const newId = users.length > 0 ? Math.max(...users.map((u) => u.id)) + 1 : 1;
    const created = { ...formattedData, id: newId } as User;
    users.push(created);
    setLocalTable('users', users);
    return created;
  },

  async update(id: number, updates: any): Promise<User> {
    const formattedUpdates = {
      ...(updates.firstName !== undefined && { first_name: updates.firstName }),
      ...(updates.first_name !== undefined && { first_name: updates.first_name }),
      ...(updates.lastName !== undefined && { last_name: updates.lastName }),
      ...(updates.last_name !== undefined && { last_name: updates.last_name }),
      ...(updates.phone !== undefined && { phone: updates.phone }),
      ...(updates.email !== undefined && { email: updates.email }),
      ...(updates.planName !== undefined && { plan_name: updates.planName }),
      ...(updates.plan_name !== undefined && { plan_name: updates.plan_name }),
      ...(updates.monthlyPrice !== undefined && { monthly_price: Number(updates.monthlyPrice) }),
      ...(updates.monthly_price !== undefined && { monthly_price: Number(updates.monthly_price) }),
      ...(updates.dueDate !== undefined && { due_date: updates.dueDate }),
      ...(updates.due_date !== undefined && { due_date: updates.due_date }),
      ...(updates.scheduleTime !== undefined && { schedule_time: updates.scheduleTime }),
      ...(updates.schedule_time !== undefined && { schedule_time: updates.schedule_time }),
      ...(updates.scheduleDays !== undefined && { schedule_days: updates.scheduleDays }),
      ...(updates.schedule_days !== undefined && { schedule_days: updates.schedule_days }),
      ...(updates.accountStatus !== undefined && { account_status: updates.accountStatus }),
      ...(updates.account_status !== undefined && { account_status: updates.account_status }),
      ...(updates.notes !== undefined && { notes: updates.notes }),
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('users').update(formattedUpdates).eq('id', id).select().single();
      if (error) throw new Error(error.message);
      return data;
    }

    const users = getLocalTable<User>('users');
    const index = users.findIndex((u) => u.id === id);
    if (index === -1) throw new Error('Alumno no encontrado');
    users[index] = { ...users[index], ...formattedUpdates };
    setLocalTable('users', users);
    return users[index];
  },

  async delete(id: number): Promise<void> {
    if (isSupabaseConfigured()) {
      const { error } = await supabase.from('users').delete().eq('id', id);
      if (error) throw new Error(error.message);
      return;
    }

    let users = getLocalTable<User>('users');
    users = users.filter((u) => u.id !== id);
    setLocalTable('users', users);
  },
};

// ==============================================================================
// 3. PAGOS Y CAJA (SUPABASE DATABASE)
// ==============================================================================
export const paymentsService = {
  async getAll(filters?: { userId?: number; month?: string; search?: string }): Promise<Payment[]> {
    if (isSupabaseConfigured()) {
      try {
        let query = supabase.from('payments').select('*, user:users(first_name, last_name, plan_name, is_online)');

        if (filters?.userId) {
          query = query.eq('user_id', filters.userId);
        }
        if (filters?.month) {
          // Filtrado correcto para columnas de tipo DATE en PostgreSQL (formato YYYY-MM)
          const parts = filters.month.split('-');
          const year = Number(parts[0]);
          const month = Number(parts[1]);
          const startDate = `${filters.month}-01`;
          const lastDay = new Date(year, month, 0).getDate();
          const endDate = `${filters.month}-${String(lastDay).padStart(2, '0')}`;
          query = query.gte('payment_date', startDate).lte('payment_date', endDate);
        }

        const { data, error } = await query.order('payment_date', { ascending: false });

        if (error) {
          console.warn('Advertencia en relación user de payments. Intentando consulta directa:', error.message);
          let rawQuery = supabase.from('payments').select('*');
          if (filters?.userId) rawQuery = rawQuery.eq('user_id', filters.userId);
          if (filters?.month) {
            const parts = filters.month.split('-');
            const year = Number(parts[0]);
            const month = Number(parts[1]);
            const startDate = `${filters.month}-01`;
            const lastDay = new Date(year, month, 0).getDate();
            const endDate = `${filters.month}-${String(lastDay).padStart(2, '0')}`;
            rawQuery = rawQuery.gte('payment_date', startDate).lte('payment_date', endDate);
          }
          const { data: rawData, error: rawError } = await rawQuery.order('payment_date', { ascending: false });
          if (rawError) {
            console.error('Error al obtener pagos de Supabase:', rawError.message);
            return [];
          }
          return rawData || [];
        }

        return (data || []).map((p: any) => ({
          ...p,
          first_name: p.user?.first_name || '',
          last_name: p.user?.last_name || '',
          plan_name: p.user?.plan_name || '',
          is_online: p.user?.is_online || 0,
        }));
      } catch (err: any) {
        console.error('Error inesperado en paymentsService.getAll:', err?.message || err);
        return [];
      }
    }

    const payments = getLocalTable<Payment>('payments');
    const users = getLocalTable<User>('users');

    return payments
      .map((p) => {
        const u = users.find((user) => user.id === p.user_id);
        return {
          ...p,
          first_name: u?.first_name || '',
          last_name: u?.last_name || '',
          plan_name: u?.plan_name || 'Plan',
          is_online: u?.is_online || 0,
        };
      })
      .sort((a, b) => (b.payment_date || '').localeCompare(a.payment_date || ''));
  },

  async create(data: {
    userId: number;
    amount: number;
    paymentDate?: string;
    paymentMethod?: string;
    period?: string;
    notes?: string;
    nextDueDate?: string;
  }): Promise<Payment> {
    const today = new Date().toISOString().split('T')[0];
    const newPayment = {
      user_id: data.userId,
      amount: Number(data.amount),
      payment_date: data.paymentDate || today,
      payment_method: data.paymentMethod || 'Efectivo',
      period: data.period || today.substring(0, 7),
      status: 'paid' as const,
      notes: data.notes || '',
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      const { data: created, error } = await supabase.from('payments').insert(newPayment).select().single();
      if (error) throw new Error(error.message);

      // Actualizar automáticamente fecha de vencimiento y estado del alumno
      if (data.nextDueDate) {
        await supabase
          .from('users')
          .update({
            due_date: data.nextDueDate,
            account_status: 'ACTIVO',
            updated_at: new Date().toISOString(),
          })
          .eq('id', data.userId);
      }
      return created;
    }

    const payments = getLocalTable<Payment>('payments');
    const newId = payments.length > 0 ? Math.max(...payments.map((p) => p.id)) + 1 : 1;
    const payment = { ...newPayment, id: newId };
    payments.unshift(payment);
    setLocalTable('payments', payments);

    if (data.nextDueDate) {
      await clientsService.update(data.userId, {
        dueDate: data.nextDueDate,
        accountStatus: 'ACTIVO',
      });
    }

    return payment;
  },

  async delete(id: number): Promise<void> {
    if (isSupabaseConfigured()) {
      const { error } = await supabase.from('payments').delete().eq('id', id);
      if (error) throw new Error(error.message);
      return;
    }

    let payments = getLocalTable<Payment>('payments');
    payments = payments.filter((p) => p.id !== id);
    setLocalTable('payments', payments);
  },
};

// ==============================================================================
// 4. RUTINAS Y EJERCICIOS (SUPABASE DATABASE)
// ==============================================================================
export const routinesService = {
  async getAll(): Promise<Routine[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('routines')
          .select('*, exercises:routine_exercises(*, exercise:exercises(*))')
          .order('id', { ascending: false });

        if (error) {
          console.warn('Advertencia en relación de routines con exercises. Consultando tabla directa:', error.message);
          const { data: rawData, error: rawError } = await supabase.from('routines').select('*').order('id', { ascending: false });
          if (rawError) {
            console.error('Error al obtener rutinas de Supabase:', rawError.message);
            return [];
          }
          return (rawData || []).map((r) => ({ ...r, exercises: [] }));
        }

        return (data || []).map((r: any) => ({
          ...r,
          exercises: (r.exercises || []).map((re: any) => ({
            ...re,
            title: re.exercise?.title,
            description: re.exercise?.description,
            video_url: re.exercise?.video_url,
          })),
        }));
      } catch (err: any) {
        console.error('Error inesperado en routinesService.getAll:', err?.message || err);
        return [];
      }
    }

    return getLocalTable<Routine>('routines');
  },

  async getById(id: number): Promise<Routine> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('routines')
        .select('*, exercises:routine_exercises(*, exercise:exercises(*))')
        .eq('id', id)
        .single();
      if (error) throw new Error(error.message);
      return data;
    }

    const routines = getLocalTable<Routine>('routines');
    const found = routines.find((r) => r.id === id);
    if (!found) throw new Error('Rutina no encontrada');
    return found;
  },

  async create(data: { title: string; description?: string; exercises?: any[] }): Promise<Routine> {
    const routinePayload = {
      title: data.title,
      description: data.description || '',
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      const { data: routine, error } = await supabase.from('routines').insert(routinePayload).select().single();
      if (error) throw new Error(error.message);

      if (data.exercises && data.exercises.length > 0) {
        const reItems = data.exercises.map((ex: any, idx: number) => ({
          routine_id: routine.id,
          exercise_id: ex.exerciseId,
          day_of_week: ex.dayOfWeek || 'Lunes',
          sets: Number(ex.sets) || 3,
          reps: String(ex.reps || '10-12'),
          notes: ex.notes || '',
          order_index: idx + 1,
        }));
        await supabase.from('routine_exercises').insert(reItems);
      }
      return routine;
    }

    const routines = getLocalTable<Routine>('routines');
    const newId = routines.length > 0 ? Math.max(...routines.map((r) => r.id)) + 1 : 1;
    const routine = { ...routinePayload, id: newId, exercises: data.exercises || [] };
    routines.unshift(routine);
    setLocalTable('routines', routines);
    return routine;
  },

  async delete(id: number): Promise<void> {
    if (isSupabaseConfigured()) {
      const { error } = await supabase.from('routines').delete().eq('id', id);
      if (error) throw new Error(error.message);
      return;
    }
    let routines = getLocalTable<Routine>('routines');
    routines = routines.filter((r) => r.id !== id);
    setLocalTable('routines', routines);
  },

  async getMyRoutines(userId?: number): Promise<Routine[]> {
    if (isSupabaseConfigured() && userId) {
      const { data, error } = await supabase
        .from('content_releases')
        .select('routine:routines(*, exercises:routine_exercises(*, exercise:exercises(*)))')
        .eq('user_id', userId)
        .eq('is_active', true)
        .lte('release_date', new Date().toISOString());

      if (error) throw new Error(error.message);
      return (data || []).map((d: any) => d.routine).filter(Boolean);
    }
    return getLocalTable<Routine>('routines');
  },
};

export const exercisesService = {
  async getAll(categoryId?: number): Promise<Exercise[]> {
    if (isSupabaseConfigured()) {
      try {
        let query = supabase.from('exercises').select('*, category:categories(name)');
        if (categoryId) {
          query = query.eq('category_id', categoryId);
        }
        const { data, error } = await query.order('title', { ascending: true });

        if (error) {
          console.warn('Advertencia en relación category de exercises. Consultando tabla directa:', error.message);
          let rawQuery = supabase.from('exercises').select('*');
          if (categoryId) rawQuery = rawQuery.eq('category_id', categoryId);
          const { data: rawData, error: rawError } = await rawQuery.order('title', { ascending: true });
          if (rawError) {
            console.error('Error al obtener ejercicios de Supabase:', rawError.message);
            return [];
          }
          return rawData || [];
        }

        return (data || []).map((ex: any) => ({
          ...ex,
          category_name: ex.category?.name,
        }));
      } catch (err: any) {
        console.error('Error inesperado en exercisesService.getAll:', err?.message || err);
        return [];
      }
    }

    return getLocalTable<Exercise>('exercises');
  },

  async create(data: { title: string; description?: string; categoryId?: number; videoUrl?: string }): Promise<Exercise> {
    const payload = {
      title: data.title,
      description: data.description || '',
      category_id: data.categoryId || null,
      video_url: data.videoUrl || null,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      const { data: ex, error } = await supabase.from('exercises').insert(payload).select().single();
      if (error) throw new Error(error.message);
      return ex;
    }

    const exercises = getLocalTable<Exercise>('exercises');
    const newId = exercises.length > 0 ? Math.max(...exercises.map((e) => e.id)) + 1 : 1;
    const item = { ...payload, id: newId };
    exercises.push(item);
    setLocalTable('exercises', exercises);
    return item;
  },
};

export const categoriesService = {
  async getAll(): Promise<Category[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('categories').select('*').order('name');
        if (error) {
          console.error('Error al obtener categorías de Supabase:', error.message);
          return [];
        }
        return data || [];
      } catch (err: any) {
        console.error('Error inesperado en categoriesService.getAll:', err?.message || err);
        return [];
      }
    }
    return getLocalTable<Category>('categories');
  },

  async create(data: { name: string; description?: string }): Promise<Category> {
    const payload = {
      name: data.name,
      description: data.description || '',
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      const { data: cat, error } = await supabase.from('categories').insert(payload).select().single();
      if (error) throw new Error(error.message);
      return cat;
    }

    const categories = getLocalTable<Category>('categories');
    const newId = categories.length > 0 ? Math.max(...categories.map((c) => c.id)) + 1 : 1;
    const item = { ...payload, id: newId };
    categories.push(item);
    setLocalTable('categories', categories);
    return item;
  },
};

// ==============================================================================
// 5. BIBLIOTECA MULTIMEDIA (SUPABASE STORAGE & DATABASE)
// ==============================================================================
export const mediaService = {
  async getAll(type?: string): Promise<MediaResource[]> {
    if (isSupabaseConfigured()) {
      try {
        let query = supabase.from('media_resources').select('*');
        if (type) {
          query = query.eq('type', type);
        }
        const { data, error } = await query.order('id', { ascending: false });
        if (error) {
          console.error('Error al obtener recursos multimedia de Supabase:', error.message);
          return [];
        }
        return data || [];
      } catch (err: any) {
        console.error('Error inesperado en mediaService.getAll:', err?.message || err);
        return [];
      }
    }
    return getLocalTable<MediaResource>('media_resources');
  },

  async uploadFile(file: File): Promise<{ url: string; filename: string; sizeBytes: number; type: 'VIDEO' | 'PDF' }> {
    const isPdf = file.type === 'application/pdf';
    const detectedType: 'VIDEO' | 'PDF' = isPdf ? 'PDF' : 'VIDEO';
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${uniqueSuffix}-${cleanName}`;

    if (isSupabaseConfigured()) {
      const { error: uploadError } = await supabase.storage
        .from(SUPABASE_STORAGE_BUCKET)
        .upload(filename, file, {
          contentType: file.type,
          upsert: true,
        });

      if (uploadError) {
        throw new Error(`Error en Supabase Storage: ${uploadError.message}`);
      }

      const { data } = supabase.storage.from(SUPABASE_STORAGE_BUCKET).getPublicUrl(filename);
      return {
        url: data.publicUrl,
        filename,
        sizeBytes: file.size,
        type: detectedType,
      };
    }

    // Fallback URL simulada para modo local offline
    const fakeUrl = URL.createObjectURL(file);
    return {
      url: fakeUrl,
      filename,
      sizeBytes: file.size,
      type: detectedType,
    };
  },

  async create(data: {
    title: string;
    description?: string;
    type: 'VIDEO' | 'PDF';
    url: string;
    fileSizeBytes?: number;
    categoryId?: number | null;
  }): Promise<MediaResource> {
    const payload = {
      title: data.title,
      description: data.description || '',
      type: data.type,
      url: data.url,
      file_size_bytes: data.fileSizeBytes || 0,
      category_id: data.categoryId || null,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      const { data: item, error } = await supabase.from('media_resources').insert(payload).select().single();
      if (error) throw new Error(error.message);
      return item;
    }

    const list = getLocalTable<MediaResource>('media_resources');
    const newId = list.length > 0 ? Math.max(...list.map((m) => m.id)) + 1 : 1;
    const item = { ...payload, id: newId };
    list.unshift(item);
    setLocalTable('media_resources', list);
    return item;
  },

  async delete(id: number): Promise<void> {
    if (isSupabaseConfigured()) {
      const { error } = await supabase.from('media_resources').delete().eq('id', id);
      if (error) throw new Error(error.message);
      return;
    }
    let list = getLocalTable<MediaResource>('media_resources');
    list = list.filter((m) => m.id !== id);
    setLocalTable('media_resources', list);
  },
};

// ==============================================================================
// 6. LIBERACIÓN DE CONTENIDO / DRIP CONTENT
// ==============================================================================
export const releasesService = {
  async getAll(userId?: number): Promise<ContentRelease[]> {
    if (isSupabaseConfigured()) {
      let query = supabase.from('content_releases').select('*, routine:routines(*), media:media_resources(*)');
      if (userId) query = query.eq('user_id', userId);
      const { data, error } = await query.order('release_date', { ascending: false });
      if (error) throw new Error(error.message);
      return data || [];
    }
    return getLocalTable<ContentRelease>('content_releases');
  },

  async assign(data: {
    userId: number;
    routineId?: number;
    mediaResourceId?: number;
    releaseDate?: string;
    notes?: string;
  }): Promise<ContentRelease> {
    const payload = {
      user_id: data.userId,
      routine_id: data.routineId || null,
      media_resource_id: data.mediaResourceId || null,
      release_date: data.releaseDate || new Date().toISOString(),
      is_active: true,
      notes: data.notes || '',
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      const { data: item, error } = await supabase.from('content_releases').insert(payload).select().single();
      if (error) throw new Error(error.message);
      return item;
    }

    const list = getLocalTable<ContentRelease>('content_releases');
    const newId = list.length > 0 ? Math.max(...list.map((r) => r.id)) + 1 : 1;
    const item = { ...payload, id: newId };
    list.push(item);
    setLocalTable('content_releases', list);
    return item;
  },

  async delete(id: number): Promise<void> {
    if (isSupabaseConfigured()) {
      const { error } = await supabase.from('content_releases').delete().eq('id', id);
      if (error) throw new Error(error.message);
      return;
    }
    let list = getLocalTable<ContentRelease>('content_releases');
    list = list.filter((r) => r.id !== id);
    setLocalTable('content_releases', list);
  },

  async getMyContent(userId?: number): Promise<ContentRelease[]> {
    return this.getAll(userId);
  },
};

// ==============================================================================
// 7. CALENDARIO Y MEETS (GOOGLE MEET / AUDITORÍAS)
// ==============================================================================
export const calendarService = {
  async getAll(userId?: number): Promise<CalendarEvent[]> {
    if (isSupabaseConfigured()) {
      try {
        let query = supabase.from('calendar_events').select('*, user:users(first_name, last_name, phone)');
        if (userId) query = query.eq('user_id', userId);
        const { data, error } = await query.order('event_date', { ascending: true });

        if (error) {
          console.warn('Advertencia en relación user de calendar_events, intentando consulta directa:', error.message);
          let rawQuery = supabase.from('calendar_events').select('*');
          if (userId) rawQuery = rawQuery.eq('user_id', userId);
          const { data: rawData, error: rawError } = await rawQuery.order('event_date', { ascending: true });
          if (rawError) {
            console.error('Error al obtener eventos de Supabase:', rawError.message);
            return [];
          }
          return rawData || [];
        }

        return (data || []).map((ev: any) => ({
          ...ev,
          first_name: ev.user?.first_name || '',
          last_name: ev.user?.last_name || '',
        }));
      } catch (err: any) {
        console.error('Error inesperado en calendarService.getAll:', err?.message || err);
        return [];
      }
    }

    const events = getLocalTable<CalendarEvent>('calendar_events');
    const users = getLocalTable<User>('users');
    return events.map((ev) => {
      const u = users.find((user) => user.id === ev.user_id);
      return {
        ...ev,
        first_name: u?.first_name || '',
        last_name: u?.last_name || '',
      };
    });
  },

  async create(data: {
    userId: number;
    title: string;
    eventDate: string;
    type?: 'MEET' | 'ENTRENAMIENTO' | 'AUDITORIA' | 'CONTROL';
    meetUrl?: string;
    notes?: string;
  }): Promise<CalendarEvent> {
    const payload: Omit<CalendarEvent, 'id'> = {
      user_id: data.userId,
      title: data.title,
      event_date: data.eventDate,
      type: data.type || 'AUDITORIA',
      status: 'PENDIENTE',
      meet_url: data.meetUrl || '',
      notes: data.notes || '',
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      const { data: item, error } = await supabase.from('calendar_events').insert(payload).select().single();
      if (error) throw new Error(error.message);
      return item;
    }

    const events = getLocalTable<CalendarEvent>('calendar_events');
    const newId = events.length > 0 ? Math.max(...events.map((e) => e.id)) + 1 : 1;
    const item: CalendarEvent = { ...payload, id: newId };
    events.push(item);
    setLocalTable('calendar_events', events);
    return item;
  },

  async updateStatus(id: number, status: 'PENDIENTE' | 'COMPLETADO' | 'CANCELADO'): Promise<void> {
    if (isSupabaseConfigured()) {
      const { error } = await supabase.from('calendar_events').update({ status }).eq('id', id);
      if (error) throw new Error(error.message);
      return;
    }

    const events = getLocalTable<CalendarEvent>('calendar_events');
    const index = events.findIndex((e) => e.id === id);
    if (index !== -1) {
      events[index].status = status;
      setLocalTable('calendar_events', events);
    }
  },

  async delete(id: number): Promise<void> {
    if (isSupabaseConfigured()) {
      const { error } = await supabase.from('calendar_events').delete().eq('id', id);
      if (error) throw new Error(error.message);
      return;
    }

    let events = getLocalTable<CalendarEvent>('calendar_events');
    events = events.filter((e) => e.id !== id);
    setLocalTable('calendar_events', events);
  },

  async getMyEvents(userId?: number): Promise<CalendarEvent[]> {
    return this.getAll(userId);
  },
};

// ==============================================================================
// 8. DASHBOARD OPERATIVO (KPIS EN TIEMPO REAL CON MANEJO SEGURO DE ERRORES)
// ==============================================================================
export const dashboardService = {
  async getCoachDashboard(): Promise<DashboardStats> {
    const todayStr = new Date().toISOString().split('T')[0];
    const currentMonth = todayStr.substring(0, 7);
    const jsDay = new Date().getDay();
    const dayOfWeek = jsDay === 0 ? 7 : jsDay;

    let allStudents: User[] = [];
    let allPayments: Payment[] = [];
    let allEvents: CalendarEvent[] = [];

    // Ejecución segura de cada consulta de forma independiente
    try {
      allStudents = await clientsService.getAll();
    } catch (err: any) {
      console.error('Error al obtener alumnos para dashboard:', err?.message || err);
      allStudents = [];
    }

    try {
      allPayments = await paymentsService.getAll({ month: currentMonth });
    } catch (err: any) {
      console.error('Error al obtener pagos para dashboard:', err?.message || err);
      allPayments = [];
    }

    try {
      allEvents = await calendarService.getAll();
    } catch (err: any) {
      console.error('Error al obtener eventos para dashboard:', err?.message || err);
      allEvents = [];
    }

    // Filtrar únicamente los alumnos (excluyendo a administradores como Augusto)
    const studentsOnly = (allStudents || []).filter((s) => s.role !== 'ADMIN');
    const activeStudents = studentsOnly.filter((s) => s.account_status === 'ACTIVO').length;

    // Alumnos con vencimiento en los próximos 7 días
    const expiringStudents = studentsOnly
      .filter((s) => {
        if (!s.is_presencial || !s.due_date || s.account_status === 'SUSPENDIDO') return false;
        const diffDays = Math.ceil((new Date(s.due_date).getTime() - new Date(todayStr).getTime()) / (1000 * 3600 * 24));
        return diffDays >= 0 && diffDays <= 7;
      })
      .sort((a, b) => (a.due_date || '').localeCompare(b.due_date || ''));

    // Alumnos atrasados / vencidos
    const overdueStudents = studentsOnly
      .filter((s) => {
        if (!s.is_presencial || !s.due_date || s.account_status === 'SUSPENDIDO') return false;
        return (s.due_date || '') < todayStr;
      })
      .sort((a, b) => (a.due_date || '').localeCompare(b.due_date || ''));

    // Alumnos de hoy según días seleccionados
    const todayStudents = studentsOnly
      .filter((s) => {
        if (!s.is_presencial || s.account_status === 'SUSPENDIDO') return false;
        try {
          const days = typeof s.schedule_days === 'string' ? JSON.parse(s.schedule_days || '[]') : s.schedule_days;
          return Array.isArray(days) && days.includes(dayOfWeek);
        } catch {
          return false;
        }
      })
      .sort((a, b) => (a.schedule_time || '12:00').localeCompare(b.schedule_time || '12:00'));

    // Total de ingresos del mes
    const monthRevenue = (allPayments || []).reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    // Citas / Meets de hoy
    const todayEvents = (allEvents || []).filter(
      (ev) => ev.event_date && ev.event_date.startsWith(todayStr) && ev.status !== 'CANCELADO'
    );

    return {
      todayStr,
      dayOfWeek,
      activeStudents,
      totalStudents: studentsOnly.length,
      expiringStudentsCount: expiringStudents.length,
      expiringStudents,
      overdueStudentsCount: overdueStudents.length,
      overdueStudents,
      todayStudentsCount: todayStudents.length,
      todayStudents,
      monthRevenue,
      recentPayments: (allPayments || []).slice(0, 6),
      todayEventsCount: todayEvents.length,
      todayEvents,
    };
  },
};
