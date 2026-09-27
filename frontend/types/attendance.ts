export interface AttendanceRecord {
  id: string;
  employee_id: string;
  date: string;
  status:
    | "present"
    | "absent"
    | "half_day"
    | "leave"
    | "holiday"
    | string;
  check_in?: string | null;
  check_out?: string | null;
  working_hours?: number | null;
  remarks?: string | null;
  created_at?: string;
}

export interface AttendanceSummary {
  total_days: number;
  present: number;
  absent: number;
  half_day: number;
  leave: number;
  holiday: number;
  attendance_days: number;
  attendance_percentage: number;
}