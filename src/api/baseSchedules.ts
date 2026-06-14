import api from './axios';
import type { ShiftTemplate } from './workShifts';

/**
 * Khung lịch chuẩn của 1 nhân viên.
 * `day_of_week`: 1 = Thứ 2 ... 7 = Chủ Nhật (chuẩn ISO).
 * BE chỉ trả về các ngày đi làm (đã có shift_id). Ngày nghỉ cố định không có record.
 */
export interface BaseSchedule {
  id: number;
  user_id: number;
  day_of_week: number;
  shift_id: number | null;
  shift?: ShiftTemplate | null;
}

export interface BaseScheduleSetupItem {
  day_of_week: number; // 1..7 theo ISO
  shift_id: number; // Ngày nghỉ cố định thì không gửi (FE filter trước khi POST).
}

export interface SetupBaseSchedulesRequest {
  user_id: number;
  items: BaseScheduleSetupItem[]; // 1..7 phần tử, mỗi day_of_week chỉ 1 lần.
}

export interface UpdateBaseScheduleDayRequest {
  shift_id: number | null;
}

export const baseSchedulesApi = {
  /** Step 1: Setup khung lịch chuẩn cho nhân viên (Admin / BranchManager). */
  setup: (data: SetupBaseSchedulesRequest) => {
    return api.post<{ message: string; data: BaseSchedule[] }>(
      '/base-schedules/setup',
      data,
    );
  },

  /** Lấy khung lịch của bản thân (Staff / Trainer). */
  getMine: () => {
    return api.get<{ data: BaseSchedule[] }>('/base-schedules/me');
  },

  /** Lấy khung lịch của 1 nhân viên (Admin / BranchManager). */
  getByUser: (userId: number | string) => {
    return api.get<{ data: BaseSchedule[] }>(`/base-schedules/users/${userId}`);
  },

  /** Cập nhật ca cho 1 ngày trong khung lịch của nhân viên. shift_id = null nghĩa là cho nghỉ cố định. */
  updateDay: (
    userId: number | string,
    dayOfWeek: number,
    data: UpdateBaseScheduleDayRequest,
  ) => {
    return api.patch<{ message: string; data: BaseSchedule }>(
      `/base-schedules/users/${userId}/days/${dayOfWeek}`,
      data,
    );
  },
};