import { Post, PostDetail, DedupResponse, Incident, TraceSpan, LogEntry } from './types';

// Persistent or random client session
export function getOrCreateUserId(): string {
  let uid = localStorage.getItem('fp_user_id');
  if (!uid) {
    uid = 'user_' + Math.random().toString(36).substring(2, 10);
    localStorage.setItem('fp_user_id', uid);
  }
  return uid;
}

export function resetUserId(): string {
  const uid = 'user_' + Math.random().toString(36).substring(2, 10);
  localStorage.setItem('fp_user_id', uid);
  return uid;
}

// Generate W3C compliant traceparent: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01
function generateTraceparent(): string {
  const randHex = (len: number) => Array.from({ length: len }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  const traceId = randHex(32);
  const spanId = randHex(16);
  return `00-${traceId}-${spanId}-01`;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (!headers.has('traceparent')) {
    headers.set('traceparent', generateTraceparent());
  }

  const res = await fetch(path, { ...options, headers });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorData.detail || `Request failed with status ${res.status}`);
  }
  return res.json();
}

export const api = {
  getPosts: async (params?: { status?: string; category?: string; sort_by?: string; search?: string }): Promise<Post[]> => {
    const query = new URLSearchParams();
    const userId = getOrCreateUserId();
    query.set('user_id', userId);
    if (params?.status && params.status !== 'all') query.set('status', params.status);
    if (params?.category && params.category !== 'all') query.set('category', params.category);
    if (params?.sort_by) query.set('sort_by', params.sort_by);
    if (params?.search) query.set('search', params.search);

    return request<Post[]>(`/api/posts?${query.toString()}`);
  },

  getPostDetail: async (id: number): Promise<PostDetail> => {
    const userId = getOrCreateUserId();
    return request<PostDetail>(`/api/posts/${id}?user_id=${userId}`);
  },

  createPost: async (title: string, description: string, category: string): Promise<Post> => {
    const userId = getOrCreateUserId();
    return request<Post>('/api/posts', {
      method: 'POST',
      body: JSON.stringify({ title, description, category, author_id: userId }),
    });
  },

  updatePostStatus: async (id: number, status: string): Promise<Post> => {
    return request<Post>(`/api/posts/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  toggleVote: async (postId: number): Promise<{ post_id: number; vote_count: number; has_voted: boolean; action: string; trace_id: string }> => {
    const userId = getOrCreateUserId();
    return request('/api/votes', {
      method: 'POST',
      body: JSON.stringify({ post_id: postId, user_id: userId }),
    });
  },

  addComment: async (postId: number, content: string): Promise<Comment> => {
    const userId = getOrCreateUserId();
    return request<Comment>(`/api/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content, author_id: userId }),
    });
  },

  checkDuplicates: async (title: string): Promise<DedupResponse> => {
    return request<DedupResponse>('/api/ai/dedup', {
      method: 'POST',
      body: JSON.stringify({ title }),
    });
  },

  suggestTags: async (title: string, description: string): Promise<{ suggested_categories: string[] }> => {
    return request('/api/ai/suggest-tags', {
      method: 'POST',
      body: JSON.stringify({ title, description }),
    });
  },

  simulateAlert: async (alertType: string, severity: string = 'critical'): Promise<Incident> => {
    return request<Incident>(`/api/alerts/simulate?alert_type=${alertType}&severity=${severity}`, {
      method: 'POST',
    });
  },

  getIncidents: async (): Promise<Incident[]> => {
    return request<Incident[]>('/api/alerts/incidents');
  },

  getTraces: async (traceId?: string): Promise<TraceSpan[]> => {
    const url = traceId ? `/api/telemetry/traces?trace_id=${traceId}` : '/api/telemetry/traces';
    return request<TraceSpan[]>(url);
  },

  getLogs: async (traceId?: string): Promise<LogEntry[]> => {
    const url = traceId ? `/api/telemetry/logs?trace_id=${traceId}` : '/api/telemetry/logs';
    return request<LogEntry[]>(url);
  },

  getTelemetryStats: async (): Promise<{ total_requests_recorded: number; error_count: number; error_rate_pct: number; avg_duration_ms: number }> => {
    return request('/api/telemetry/stats');
  }
};
