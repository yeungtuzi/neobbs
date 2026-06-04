const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const token = this.getToken();
    const headers: Record<string, string> = {
      ...((options.headers as Record<string, string>) || {}),
    };
    // Only set Content-Type for JSON bodies (not FormData)
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetch(url, {
      ...options,
      credentials: 'include',
      headers,
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(error.message || `Request failed: ${res.status}`);
    }

    return res.json();
  }

  // Auth
  login(email: string, password: string) {
    return this.request<{ user: unknown; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  register(username: string, email: string, password: string) {
    return this.request<{ user: unknown; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    });
  }

  getMe() {
    return this.request<{ user: unknown }>('/auth/me');
  }

  // Boards
  getBoards() {
    return this.request<unknown[]>('/boards');
  }

  getBoard(slug: string) {
    return this.request<unknown>(`/boards/${slug}`);
  }

  // Threads
  getThreads(boardSlug: string, cursor?: string, digestOnly = false) {
    const params = new URLSearchParams({ limit: '20' });
    if (cursor) params.set('cursor', cursor);
    if (digestOnly) params.set('digest', 'true');
    return this.request<unknown>(`/boards/${boardSlug}/threads?${params}`);
  }

  createThread(boardSlug: string, title: string, content: unknown, attachmentIds?: string[]) {
    return this.request<unknown>(`/boards/${boardSlug}/threads`, {
      method: 'POST',
      body: JSON.stringify({ title, content, attachmentIds }),
    });
  }

  getThread(threadId: string) {
    return this.request<unknown>(`/threads/${threadId}`);
  }

  createReply(threadId: string, content: unknown, attachmentIds?: string[], parentPostId?: string) {
    return this.request<unknown>(`/threads/${threadId}/replies`, {
      method: 'POST',
      body: JSON.stringify({ content, attachmentIds, parentPostId }),
    });
  }

  // Edit & delete
  updatePost(postId: string, content: unknown) {
    return this.request<{ ok: boolean }>(`/posts/${postId}`, {
      method: 'PATCH',
      body: JSON.stringify({ content }),
    });
  }

  deletePost(postId: string) {
    return this.request<{ deleted: boolean }>(`/posts/${postId}`, {
      method: 'DELETE',
    });
  }

  toggleDigest(threadId: string) {
    return this.request<{ isDigest: boolean }>(`/threads/${threadId}/digest`, {
      method: 'PATCH',
    });
  }

  togglePostDigest(postId: string) {
    return this.request<{ isDigest: boolean }>(`/posts/${postId}/digest`, {
      method: 'PATCH',
    });
  }

  batchDelete(boardSlug: string, from: number, to: number) {
    return this.request<{ deleted: number }>(`/boards/${boardSlug}/cleanup`, {
      method: 'POST',
      body: JSON.stringify({ from, to }),
    });
  }

  getDeletedPosts(boardSlug: string, cursor?: string) {
    const params = new URLSearchParams({ limit: '50' });
    if (cursor) params.set('cursor', cursor);
    return this.request<{ items: any[]; nextCursor: string | null; hasMore: boolean }>(
      `/boards/${boardSlug}/deleted?${params}`,
    );
  }

  // Likes
  toggleLike(postId: string) {
    return this.request<{ liked: boolean }>(`/posts/${postId}/like`, {
      method: 'POST',
    });
  }

  // Search
  search(q: string, boardSlug?: string) {
    const params = new URLSearchParams({ q });
    if (boardSlug) params.set('board', boardSlug);
    return this.request<{ items: unknown[]; total: number }>(
      `/search?${params}`,
    );
  }

  // Upload
  async uploadAttachment(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    const token = this.getToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const url = `${this.baseUrl}/attachments/upload`;
    const res = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers,
      body: formData,
    });
    if (!res.ok) {
      const errBody = await res.text();
      console.error('[upload] HTTP', res.status, errBody);
      throw new Error(`Upload failed: ${res.status} ${errBody}`);
    }
    return res.json();
  }
}

export const api = new ApiClient(API_BASE);
