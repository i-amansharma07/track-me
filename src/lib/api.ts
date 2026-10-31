export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data?: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export type TaskStatus = 'pending' | 'active' | 'pause' | 'completed';
export type TaskTag = 'Exercise' | 'Rest' | 'Study' | 'Discipline' | 'Code' | 'Revision';

export type TaskData = {
  id: string;
  userId: string;
  title: string;
  status: TaskStatus;
  tag?: TaskTag;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export type PaginatedTasks = {
  data: TaskData[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const BASE = '/api';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<ApiResponse<T>> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
    credentials: 'include',
  });
  const json = (await res.json().catch(() => null)) as ApiResponse<T> | null;
  if (!res.ok || !json?.success) {
    throw new Error(json?.message || `Request failed: ${res.status}`);
  }
  return json;
}

export const api = {
  tasks: {
    list: (params?: { status?: TaskStatus; tag?: TaskTag; page?: number; limit?: number }) => {
      const search = new URLSearchParams();
      if (params?.status) search.set('status', params.status);
      if (params?.tag) search.set('tag', params.tag);
      if (params?.page) search.set('page', String(params.page));
      if (params?.limit) search.set('limit', String(params.limit));
      return fetchJson<TaskData[]>(`${BASE}/tasks?${search.toString()}`);
    },
    get: (taskId: string) => fetchJson<TaskData>(`${BASE}/tasks/${taskId}`),
    create: (body: { title: string; tag?: TaskTag }) =>
      fetchJson<TaskData>(`${BASE}/tasks`, { method: 'POST', body: JSON.stringify(body) }),
    update: (taskId: string, body: { title?: string; tag?: TaskTag }) =>
      fetchJson<TaskData>(`${BASE}/tasks/${taskId}`, { method: 'PATCH', body: JSON.stringify(body) }),
    delete: (taskId: string) => fetchJson<null>(`${BASE}/tasks/${taskId}`, { method: 'DELETE' }),
  },
};
