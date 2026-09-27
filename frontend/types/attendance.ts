export interface AttendanceSummary {
  total_days: number;
  present: number;
  absent: number;
  half_day: number;
  attendance_percentage: number;
}