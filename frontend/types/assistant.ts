export interface Source {
  source?: string;
  filename?: string;
  score?: number;
  chunk?: string;
  [key: string]: unknown;
}

export interface Confidence {
  score: number;
  level: "high" | "medium" | "low" | string;
  top_similarity?: number;
  mean_similarity?: number;
  evidence_score?: number;
  relevant_chunk_count?: number;
}

export interface LeaveAction {
  type: "create_leave";
  status:
    | "pending_confirmation"
    | "executing"
    | "completed"
    | "cancelled";
  leave_type: string;
  start_date: string;
  end_date: string;
  reason?: string | null;
  confirmation_text?: string;
}

export interface AskResponse {
  answer: string;
  sources: Source[];
  confidence: Confidence;
  escalation_required: boolean;
  escalation_reason?: string | null;
  hr_ticket_id?: string | null;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  response?: AskResponse;
  action?: LeaveAction;
}