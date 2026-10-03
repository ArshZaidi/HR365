export interface HRRequest {
  id: string;
  employee_id: string;
  subject: string;
  description: string;
  category: string;
  priority: "low" | "normal" | "high" | "urgent" | string;
  status: string;
  assigned_to?: string | null;
  is_escalated?: boolean;
  escalated_at?: string | null;
  escalation_reason?: string | null;
  created_at: string;
  updated_at?: string;
  resolved_at?: string | null;
}

export interface HRRequestsResponse {
  requests: HRRequest[];
}

export interface TicketComment {
  id: string;
  request_id: string;
  author_id: string;
  author_name?: string | null;
  author_role: "hr" | "employee" | string;
  body: string;
  created_at: string;
}

export interface TicketCommentsResponse {
  comments: TicketComment[];
}

export interface TicketCommentResponse {
  comment: TicketComment;
}