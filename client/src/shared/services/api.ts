import {
  authService,
  clientsService,
  paymentsService,
  routinesService,
  exercisesService,
  categoriesService,
  mediaService,
  releasesService,
  calendarService,
  dashboardService,
} from './supabaseApi';

export const getAuthToken = (): string | null => {
  return localStorage.getItem('zgym_token');
};

export const setAuthToken = (token: string): void => {
  localStorage.setItem('zgym_token', token);
};

export const removeAuthToken = (): void => {
  localStorage.removeItem('zgym_token');
  localStorage.removeItem('zgym_user');
};

// ==============================================================================
// SERVICIOS UNIFICADOS ZGYM (DIRECTOS A SUPABASE + PWA STANDALONE)
// ==============================================================================

export const authAPI = {
  login: async (credentials: { email: string; password: string }) => {
    const { user, token } = await authService.login(credentials.email, credentials.password);
    return { data: { user, token } };
  },
  getMe: async () => {
    const saved = localStorage.getItem('zgym_user');
    const parsed = saved ? JSON.parse(saved) : null;
    const user = await authService.getMe(parsed?.id);
    return { data: { user } };
  },
  changePassword: async (data: { currentPassword: string; newPassword: string }) => {
    await authService.changePassword(data.currentPassword, data.newPassword);
    return { success: true };
  },
};

export const dashboardAPI = {
  getCoachDashboard: async () => {
    const data = await dashboardService.getCoachDashboard();
    return { data };
  },
};

export const clientsAPI = {
  getAll: async (filters?: { search?: string; status?: string; type?: string; role?: string }) => {
    const users = await clientsService.getAll(filters);
    return { data: { users } };
  },
  getById: async (id: number) => {
    const user = await clientsService.getById(id);
    return { data: { user } };
  },
  create: async (clientData: any) => {
    const user = await clientsService.create(clientData);
    return { data: { user } };
  },
  update: async (id: number, updates: any) => {
    const user = await clientsService.update(id, updates);
    return { data: { user } };
  },
  delete: async (id: number) => {
    await clientsService.delete(id);
    return { success: true };
  },
};

export const paymentsAPI = {
  getAll: async (filters?: { userId?: number; month?: string; search?: string }) => {
    const payments = await paymentsService.getAll(filters);
    return { data: { payments } };
  },
  create: async (data: {
    userId: number;
    amount: number;
    paymentDate?: string;
    paymentMethod?: string;
    period?: string;
    notes?: string;
    nextDueDate?: string;
  }) => {
    const payment = await paymentsService.create(data);
    return { data: { payment } };
  },
  delete: async (id: number) => {
    await paymentsService.delete(id);
    return { success: true };
  },
};

export const routinesAPI = {
  getAll: async () => {
    const routines = await routinesService.getAll();
    return { data: { routines } };
  },
  getById: async (id: number) => {
    const routine = await routinesService.getById(id);
    return { data: { routine } };
  },
  create: async (data: any) => {
    const routine = await routinesService.create(data);
    return { data: { routine } };
  },
  update: async (id: number, data: any) => {
    // Para simplificar, update id
    return { data: { routine: data } };
  },
  delete: async (id: number) => {
    await routinesService.delete(id);
    return { success: true };
  },
  getMyRoutines: async () => {
    const saved = localStorage.getItem('zgym_user');
    const parsed = saved ? JSON.parse(saved) : null;
    const routines = await routinesService.getMyRoutines(parsed?.id);
    return { data: { routines } };
  },
};

export const exercisesAPI = {
  getAll: async (categoryId?: number) => {
    const exercises = await exercisesService.getAll(categoryId);
    return { data: { exercises } };
  },
  create: async (data: any) => {
    const exercise = await exercisesService.create(data);
    return { data: { exercise } };
  },
};

export const categoriesAPI = {
  getAll: async () => {
    const categories = await categoriesService.getAll();
    return { data: { categories } };
  },
  create: async (data: any) => {
    const category = await categoriesService.create(data);
    return { data: { category } };
  },
};

export const mediaAPI = {
  getAll: async (type?: string) => {
    const media = await mediaService.getAll(type);
    return { data: { media } };
  },
  uploadFile: async (formData: FormData) => {
    const file = formData.get('file') as File;
    if (!file) throw new Error('No se envió ningún archivo');
    const result = await mediaService.uploadFile(file);
    return { data: result };
  },
  create: async (data: {
    title: string;
    description?: string;
    type: 'VIDEO' | 'PDF';
    url: string;
    fileSizeBytes?: number;
    categoryId?: number | null;
  }) => {
    const item = await mediaService.create(data);
    return { data: { media: item } };
  },
  delete: async (id: number) => {
    await mediaService.delete(id);
    return { success: true };
  },
};

export const releasesAPI = {
  getAll: async (userId?: number) => {
    const releases = await releasesService.getAll(userId);
    return { data: { releases } };
  },
  assign: async (data: {
    userId: number;
    routineId?: number;
    mediaResourceId?: number;
    releaseDate?: string;
    notes?: string;
  }) => {
    const release = await releasesService.assign(data);
    return { data: { release } };
  },
  delete: async (id: number) => {
    await releasesService.delete(id);
    return { success: true };
  },
  getMyContent: async () => {
    const saved = localStorage.getItem('zgym_user');
    const parsed = saved ? JSON.parse(saved) : null;
    const content = await releasesService.getMyContent(parsed?.id);
    return { data: { content } };
  },
};

export const calendarAPI = {
  getAll: async (userId?: number) => {
    const events = await calendarService.getAll(userId);
    return { data: { events } };
  },
  create: async (data: any) => {
    const event = await calendarService.create(data);
    return { data: { event } };
  },
  updateStatus: async (id: number, status: string) => {
    await calendarService.updateStatus(id, status as any);
    return { success: true };
  },
  delete: async (id: number) => {
    await calendarService.delete(id);
    return { success: true };
  },
  getMyEvents: async () => {
    const saved = localStorage.getItem('zgym_user');
    const parsed = saved ? JSON.parse(saved) : null;
    const events = await calendarService.getMyEvents(parsed?.id);
    return { data: { events } };
  },
};
