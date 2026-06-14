import api from './axios';

export interface WorkShift {
  id: number;
  user_id: number;
  branch_id: number;
  date: string;
  shift_id?: number | null;
  // BE trả thời gian ca qua relation `shift` (template ca trực).
  // Giữ start_time/end_time optional để tương thích dữ liệu cũ nếu có.
  start_time?: string;
  end_time?: string;
  check_in_code: string;
  status: 'scheduled' | 'off_approved' | 'completed' | 'cancelled';
  shift?: ShiftTemplate | null;
  user?: {
    id: number;
    full_name: string;
    email: string;
    phone_number?: string;
  };
  branch?: {
    id: number;
    branch_name: string;
    address: string;
  };
}

export interface ShiftTemplate {
  id: number;
  shift_name: string;
  start_time: string;
  end_time: string;
}

export interface CreateShiftRequest {
  user_id: number;
  branch_id: number;
  date: string;
  shift_id?: number | null;
  check_in_code?: string;
}

export interface UpdateShiftRequest {
  date?: string;
  shift_id?: number | null;
  status?: 'scheduled' | 'off_approved' | 'completed' | 'cancelled';
  check_in_code?: string;
}

export interface ActivateFirstWeekRequest {
  user_id: number;
  start_date: string; // YYYY-MM-DD
}

export interface ActivateFirstWeekResult {
  generated: number;
  off_approved: number;
  skipped: number;
  range: { start: string; end: string };
}

export interface GenerateNextWeekResult extends ActivateFirstWeekResult {}

export const workShiftsApi = {
  listTemplates: () => {
    return api.get<{ data: ShiftTemplate[] }>('/shifts');
  },

  list: (params?: { date?: string; user_id?: number | string; branch_id?: number | string; status?: string }) => {
    return api.get<{ data: WorkShift[] }>('/work-shifts', { params });
  },

  getMyShifts: (params?: { date?: string; branch_id?: number | string }) => {
    return api.get<{ message: string; data: WorkShift[] }>('/work-shifts/me', { params });
  },

  create: (data: CreateShiftRequest) => {
    return api.post<{ data: WorkShift }>('/work-shifts', data);
  },

  update: (id: number | string, data: UpdateShiftRequest) => {
    return api.put<{ data: WorkShift }>(`/work-shifts/${id}`, data);
  },

  delete: (id: number | string) => {
    return api.delete(`/work-shifts/${id}`);
  },

  // Step 2: Kích hoạt lịch tuần đầu cho nhân viên mới (gọi ngay sau setup base schedules).
  activateFirstWeek: (data: ActivateFirstWeekRequest) => {
    return api.post<{ message: string; data: ActivateFirstWeekResult }>(
      '/work-shifts/activate-first-week',
      data,
    );
  },

  // Step 3 (manual trigger): Sinh lịch tuần kế tiếp cho toàn hệ thống. Cron đã chạy 00:00 Thứ 7,
  // chỉ dùng cho test hoặc tạo lại lịch sau khi điều chỉnh khung.
  triggerGenerateNextWeek: () => {
    return api.post<{ message: string; data: GenerateNextWeekResult }>(
      '/work-shifts/generate-next-week',
    );
  },
};
