export interface Leave {
  id: string;
  employee_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  updated_at: string;
}

export interface LeaveSummary {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}