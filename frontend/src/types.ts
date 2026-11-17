export type PostStatus = 'open' | 'under_review' | 'planned' | 'in_progress' | 'completed';

export interface Post {
  id: number;
  title: string;
  description: string;
  category: string;
  status: PostStatus;
  vote_count: number;
  author_id: string;
  created_at: string;
  updated_at: string;
  has_voted: boolean;
  comments_count: number;
}

export interface Comment {
  id: number;
  post_id: number;
  author_id: string;
  content: string;
  created_at: string;
}

export interface PostDetail extends Post {
  comments: Comment[];
}

export interface DuplicateMatch {
  id: number;
  title: string;
  category: string;
  status: string;
  vote_count: number;
  similarity: number;
}

export interface DedupResponse {
  query: string;
  matches: DuplicateMatch[];
  has_duplicate_warning: boolean;
}

export interface Incident {
  id: number;
  alert_name: string;
  severity: 'warning' | 'critical';
  status: 'firing' | 'investigating' | 'resolved';
  symptoms: string;
  root_cause?: string;
  remediation_action?: string;
  trace_id?: string;
  postmortem_md?: string;
  created_at: string;
}

export interface TraceSpan {
  name: string;
  trace_id: string;
  span_id: string;
  parent_id?: string;
  duration_ms: number;
  status: string;
  timestamp: string;
  attributes: Record<string, any>;
}

export interface LogEntry {
  timestamp: string;
  level: string;
  logger: string;
  message: string;
  trace_id: string;
  span_id: string;
  [key: string]: any;
}
