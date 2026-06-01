import api from './axios';

export type PostImage = {
  id: number;
  image_url: string;
};

export type Post = {
  id: number;
  user_id: number;
  title: string;
  content: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  images: PostImage[];
  user?: {
    full_name?: string;
    role?: {
      name: string;
    }
  }
};

export type CreatePostPayload = {
  title: string;
  content: string;
  is_published?: boolean;
  images?: string[];
};

export type UpdatePostPayload = Partial<CreatePostPayload>;

export const postsApi = {
  list: async (params?: { page?: number; limit?: number; search?: string }) => {
    const response = await api.get('/posts', { params });
    // Based on the backend service, it returns { posts: [], meta: {} }
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
};
