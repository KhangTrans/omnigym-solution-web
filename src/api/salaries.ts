import api from './axios';

export type SalaryType = 'all' | 'staff' | 'trainer';

export interface SalaryListParams {
  month?: number;
  year?: number;
  type?: SalaryType;
  search?: string;
  branch_id?: number;
}

export interface SalaryItem {
  id: string;
  user_id: number;
  profile_id: number;
  type: 'staff' | 'trainer';
  full_name: string | null;
  email: string | null;
  phone_number: string | null;
  branch_id: number | null;
  branch_name: string | null;
  base_rate: number;
  scheduled_shifts: number;
  present_shifts: number;
  late_shifts: number;
  half_day_shifts: number;
  absent_shifts: number;
  completed_sessions: number;
  gross_salary: number;
  deductions: number;
  net_salary: number;
  source_note: string;
}

export interface SalarySummary {
  period: string;
  staff_count: number;
  trainer_count: number;
  total_people: number;
  staff_salary: number;
  trainer_salary: number;
  total_salary: number;
}

export interface SalaryRules {
  staff_shift_rate: number;
  staff_half_day_rate: number;
  trainer_rate_source: string;
}

export interface SalaryListResponse {
  items: SalaryItem[];
  summary: SalarySummary;
  rules: SalaryRules;
}

export const salaryApi = {
  list: (params?: SalaryListParams) =>
    api.get<{ message: string; data: SalaryListResponse }>('/salaries', { params }),
};
