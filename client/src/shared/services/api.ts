const BASE_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

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

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    removeAuthToken();
    if (!window.location.pathname.includes('/login')) {
      window.location.href = '/login';
    }
  }

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || `Error HTTP ${response.status}`);
  }

  return data;
}

// -------------------------------------------------------------
// SERVICIOS UNIFICADOS ZGYM
// -------------------------------------------------------------

export const authAPI = {
  login: (credentials: { email: string; password: string }) =>
    apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
  getMe: () => apiRequest('/auth/me'),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    apiRequest('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

export const dashboardAPI = {
  getCoachDashboard: () => apiRequest('/dashboard'),
};

export const clientsAPI = {
  getAll: (filters?: { search?: string; status?: string; type?: string; role?: string }) => {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.type) params.append('type', filters.type);
    if (filters?.role) params.append('role', filters.role);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return apiRequest(`/users${qs}`);
  },
  getById: (id: number) => apiRequest(`/users/${id}`),
  create: (clientData: any) =>
    apiRequest('/users', {
      method: 'POST',
      body: JSON.stringify(clientData),
    }),
  update: (id: number, updates: any) =>
    apiRequest(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),
  delete: (id: number) =>
    apiRequest(`/users/${id}`, {
      method: 'DELETE',
    }),
};

export const paymentsAPI = {
  getAll: (filters?: { userId?: number; month?: string; search?: string }) => {
    const params = new URLSearchParams();
    if (filters?.userId) params.append('userId', String(filters.userId));
    if (filters?.month) params.append('month', filters.month);
    if (filters?.search) params.append('search', filters.search);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return apiRequest(`/payments${qs}`);
  },
  create: (data: { userId: number; amount: number; paymentDate?: string; paymentMethod?: string; period?: string; notes?: string; nextDueDate?: string }) =>
    apiRequest('/payments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  delete: (id: number) =>
    apiRequest(`/payments/${id}`, {
      method: 'DELETE',
    }),
};

export const routinesAPI = {
  getAll: () => apiRequest('/routines'),
  getById: (id: number) => apiRequest(`/routines/${id}`),
  create: (data: any) =>
    apiRequest('/routines', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: number, data: any) =>
    apiRequest(`/routines/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: number) =>
    apiRequest(`/routines/${id}`, {
      method: 'DELETE',
    }),
  getMyRoutines: () => apiRequest('/routines/my-routines'),
};

export const exercisesAPI = {
  getAll: (categoryId?: number) => {
    const qs = categoryId ? `?categoryId=${categoryId}` : '';
    return apiRequest(`/exercises${qs}`);
  },
  create: (data: any) =>
    apiRequest('/exercises', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

export const categoriesAPI = {
  getAll: () => apiRequest('/categories'),
  create: (data: any) =>
    apiRequest('/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

export const mediaAPI = {
  getAll: (type?: string) => {
    const qs = type ? `?type=${type}` : '';
    return apiRequest(`/media${qs}`);
  },
  uploadFile: (formData: FormData) =>
    apiRequest('/media/upload', {
      method: 'POST',
      body: formData,
    }),
  create: (data: { title: string; description?: string; type: 'VIDEO' | 'PDF'; url: string; fileSizeBytes?: number; categoryId?: number | null }) =>
    apiRequest('/media', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  delete: (id: number) =>
    apiRequest(`/media/${id}`, {
      method: 'DELETE',
    }),
};

export const releasesAPI = {
  getAll: (userId?: number) => {
    const qs = userId ? `?userId=${userId}` : '';
    return apiRequest(`/releases${qs}`);
  },
  assign: (data: { userId: number; routineId?: number; mediaResourceId?: number; releaseDate?: string; notes?: string }) =>
    apiRequest('/releases', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  delete: (id: number) =>
    apiRequest(`/releases/${id}`, {
      method: 'DELETE',
    }),
  getMyContent: () => apiRequest('/content/my-content'),
};

export const calendarAPI = {
  getAll: (userId?: number) => {
    const qs = userId ? `?userId=${userId}` : '';
    return apiRequest(`/calendar/events${qs}`);
  },
  create: (data: any) =>
    apiRequest('/calendar/events', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateStatus: (id: number, status: string) =>
    apiRequest(`/calendar/events/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  delete: (id: number) =>
    apiRequest(`/calendar/events/${id}`, {
      method: 'DELETE',
    }),
  getMyEvents: () => apiRequest('/calendar/my-events'),
};
