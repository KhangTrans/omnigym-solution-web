import api from './axios';

export type PostStatus =
  | 'Draft'
  | 'Pending'
  | 'Approved'
  | 'Rejected'
  | 'Published'
  | 'Public'
  | 'draft'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'published'
  | 'public';

export type PostImage = {
  id: number;
  image_url: string;
};

export type Post = {
  id: number;
  user_id: number;
  title?: string;
  content?: string;
  category?: string;
  status: PostStatus;
  /** Backward compatibility for old API responses */
  is_published?: boolean;
  /** Total view count — 0 when null/undefined from DB */
  view_count?: number;
  created_at: string;
  updated_at: string;
  images: PostImage[];
  user?: {
    id?: number;
    full_name?: string;
    avatar_url?: string;
    role?: {
      name: string;
      role_name?: string;
    }
  }
};

export type CreatePostPayload = {
  title: string;
  content: string;
  status?: PostStatus;
  images?: string[];
};

export type UpdatePostPayload = Partial<CreatePostPayload>;

// ─── Session-level cache to prevent duplicate view calls ────────────────────
// Using a module-level Set so it persists across re-renders but resets on page reload
const viewedPostsInSession = new Set<number>();

export type TrackViewResult = {
  success: boolean;
  alreadyViewed?: boolean;
  viewCount?: number;
  skipped?: boolean;
};

/**
 * Fire-and-forget view tracker.
 * - Locks immediately using session Set to prevent double-calls
 * - Unlocks on network error to allow retry on next navigation
 */
export const trackBlogView = async (postId: number): Promise<TrackViewResult | null> => {
  if (viewedPostsInSession.has(postId)) return null; // Already tracked in this session
  viewedPostsInSession.add(postId); // Lock immediately

  try {
    const response = await api.post(`/posts/${postId}/view`);
    return response.data as TrackViewResult;
  } catch (err) {
    // Network/server error — unlock so user can retry after navigation
    viewedPostsInSession.delete(postId);
    return null;
  }
};

export const postsApi = {
  list: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    sortBy?: string;
    status?: string;
  }) => {
    const response = await api.get('/posts', { params });
    return response.data;
  },
  getById: async (id: number) => {
    const response = await api.get(`/posts/${id}`);
    return response.data;
  },
  create: async (payload: CreatePostPayload) => {
    const response = await api.post('/posts', payload);
    return response.data;
  },
  update: async (id: number, payload: UpdatePostPayload) => {
    const response = await api.put(`/posts/${id}`, payload);
    return response.data;
  },
  remove: async (id: number) => {
    await api.delete(`/posts/${id}`);
  },
  approve: async (id: number) => {
    const response = await api.patch(`/posts/${id}/approve`);
    return response.data;
  },
  reject: async (id: number, payload?: { note?: string; reason?: string }) => {
    const response = await api.patch(`/posts/${id}/reject`, payload ?? {});
    return response.data;
  },
  submit: async (id: number) => {
    const response = await api.patch(`/posts/${id}/submit`);
    return response.data;
  },
};
