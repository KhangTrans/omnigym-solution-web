import api from './axios';

export type BlogStatus = 'draft' | 'published';

export type Blog = {
  id: number;
  title: string;
  content: string;
  coverUrl?: string;
  category: string;
  tags: string[];
  status: BlogStatus;
  author: string;
  createdAt: string;
  updatedAt: string;
};

export type BlogCreatePayload = {
  title: string;
  content: string;
  cover_url?: string;
  category: string;
  tags?: string[];
  status?: BlogStatus;
  author?: string;
};

export type BlogUpdatePayload = BlogCreatePayload;

const normalizeTags = (value: unknown) => {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
  }
  return [] as string[];
};

const mapBlog = (raw: any): Blog => ({
  id: Number(raw.id),
  title: String(raw.title ?? ''),
  content: String(raw.content ?? ''),
  coverUrl: raw.cover_url ?? '',
  category: String(raw.category ?? ''),
  tags: normalizeTags(raw.tags),
  status: raw.status as BlogStatus,
  author: String(raw.author ?? ''),
  createdAt: String(raw.created_at ?? ''),
  updatedAt: String(raw.updated_at ?? ''),
});

export const blogsApi = {
  list: async () => {
    const response = await api.get('/blogs');
    return Array.isArray(response.data) ? response.data.map(mapBlog) : [];
  },
  create: async (payload: BlogCreatePayload) => {
    const response = await api.post('/blogs', payload);
    return mapBlog(response.data);
  },
  update: async (id: number, payload: BlogUpdatePayload) => {
    const response = await api.put(`/blogs/${id}`, payload);
    return mapBlog(response.data);
  },
  remove: async (id: number) => {
    await api.delete(`/blogs/${id}`);
  },
};
