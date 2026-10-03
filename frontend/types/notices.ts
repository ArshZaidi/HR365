export type NoticePriority = "low" | "normal" | "high" | "urgent";

export interface Notice {
  id: string;
  title: string;
  body: string;
  priority: NoticePriority;
  category: string;
  author_id: string;
  author_name?: string | null;
  published_at: string;
  expires_at?: string | null;
  is_read: boolean;
}

export interface NoticesResponse {
  notices: Notice[];
  unread_count: number;
}

export interface NoticeResponse {
  notice: Notice;
}