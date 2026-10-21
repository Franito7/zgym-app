export type Role = 'ADMIN' | 'ENTRENADOR' | 'ALUMNO';
export type AccountStatus = 'ACTIVO' | 'VENCIDO' | 'SUSPENDIDO';

export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string | null;
  role: Role;
  phone: string | null;
  trainer_id?: number | null;
  trainer_name?: string | null;
  account_status: AccountStatus;
  goals?: string | null;
  birth_date?: string | null;
  is_active: number | boolean;
  
  // Módulo Presencial
  is_presencial: number | boolean;
  plan_name?: string | null;
  monthly_price?: number;
  due_date?: string | null;
  schedule_days?: number[] | string; // JSON [1,2,3,4,5]
  schedule_time?: string;
  enrollment_date?: string | null;

  // Módulo Online
  is_online: number | boolean;

  notes?: string | null;
  created_at?: string;
  updated_at?: string;

  // Relaciones cargadas en ficha 360°
  payments?: Payment[];
  releases?: ContentRelease[];
  events?: CalendarEvent[];
}

export interface Payment {
  id: number;
  user_id: number;
  amount: number;
  payment_date: string;
  payment_method: string;
  period: string;
  status: 'paid' | 'pending' | 'cancelled';
  notes?: string;
  created_at?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  plan_name?: string;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  created_at?: string;
}

export interface Exercise {
  id: number;
  category_id?: number | null;
  category_name?: string;
  title: string;
  description?: string;
  video_url?: string;
  created_at?: string;
}

export interface RoutineExercise {
  id?: number;
  routine_id?: number;
  exercise_id: number;
  title?: string;
  category_name?: string;
  day_of_week: string;
  sets: number;
  reps: string;
  notes?: string;
  order_index?: number;
}

export interface Routine {
  id: number;
  title: string;
  description?: string;
  created_by?: number;
  created_at?: string;
  exercises?: RoutineExercise[];
}

export interface MediaResource {
  id: number;
  title: string;
  description?: string;
  type: 'VIDEO' | 'PDF';
  url: string;
  file_size_bytes?: number;
  category_id?: number | null;
  created_at?: string;
}

export interface ContentRelease {
  id: number;
  user_id: number;
  media_resource_id?: number | null;
  routine_id?: number | null;
  release_date: string;
  is_active: number | boolean;
  notes?: string;
  routine_title?: string;
  media_title?: string;
  media_type?: 'VIDEO' | 'PDF';
  media_url?: string;
}

export interface CalendarEvent {
  id: number;
  user_id: number;
  title: string;
  event_date: string;
  type: 'MEET' | 'ENTRENAMIENTO' | 'AUDITORIA' | 'CONTROL';
  status: 'PENDIENTE' | 'COMPLETADO' | 'CANCELADO';
  notes?: string;
  meet_url?: string;
  created_at?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
}

export interface DashboardStats {
  todayStr: string;
  dayOfWeek: number;
  activeStudents: number;
  totalStudents: number;
  expiringStudentsCount: number;
  expiringStudents: User[];
  overdueStudentsCount: number;
  overdueStudents: User[];
  todayStudentsCount: number;
  todayStudents: User[];
  monthRevenue: number;
  recentPayments: Payment[];
  todayEventsCount: number;
  todayEvents: CalendarEvent[];
}
