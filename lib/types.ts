export interface EmailThread {
  id: string
  user_id: string
  title: string
  content: string
  created_at: string
  updated_at: string
}

export interface Todo {
  id: string
  user_id: string
  analysis_id: string
  thread_id: string
  description: string
  assignee?: string
  priority: "high" | "medium" | "low"
  due_date?: string
  completed: boolean
  completed_at?: string
  created_at: string
  // Joined fields for display
  thread_title?: string
}

export interface Stakeholder {
  name: string
  email: string
  role: string
  evidence: string
}

export interface ActionItem {
  description: string
  assignee: string
  priority: "high" | "medium" | "low"
  evidence: string
}

export interface Deadline {
  date: string
  description: string
  evidence: string
}

export interface KeyDecision {
  decision: string
  rationale: string
  evidence: string
}

export interface OpenQuestion {
  question: string
  context: string
  evidence: string
}

export interface Citation {
  source_id: string
  note?: string
  quoted_text?: string
}

export interface Source {
  id: string
  title: string
  url: string
  publisher?: string
  published_date?: string
  accessed_date?: string
  notes?: string
}

export interface BulletItem {
  text: string
  citations?: Citation[]
}

export interface DefinitionItem {
  term: string
  definition: string
  citations?: Citation[]
}

export interface QAItem {
  q: string
  a: string
  citations?: Citation[]
}

export interface TableColumn {
  key: string
  label: string
}

export interface TableCell {
  value: string | number | boolean | null
  citations?: Citation[]
}

export interface Table {
  caption?: string
  columns: TableColumn[]
  rows: TableCell[][]
}

export interface Block {
  type: "heading" | "paragraph" | "bullets" | "table" | "callout" | "definition_list" | "qa_list" | "divider"
  text?: string
  level?: number
  items?: BulletItem[]
  definitions?: DefinitionItem[]
  questions?: QAItem[]
  table?: Table
  callout_kind?: "info" | "warning" | "risk" | "tip" | "note"
  citations?: Citation[]
}

export interface Section {
  id: string
  kind: "why_it_matters" | "what_it_is" | "key_points" | "whats_new" | "numbers" | "pros_cons" | "risks_mitigations" | "recommendations" | "faq" | "custom"
  title: string
  summary?: string
  blocks: Block[]
}

export interface FormattedBrief {
  schema_version: string
  doc_id?: string
  title: string
  subtitle?: string
  topic?: string
  audience?: string
  tone?: string
  generated_at?: string
  tldr: string[]
  sections: Section[]
  sources: Source[]
  markdown_fallback?: string
}

export interface ResearchResult extends FormattedBrief {
  id?: string
  isLoading?: boolean
  status?: string
}

export interface SuggestedReply {
  title: string
  content: string
}

export interface Analysis {
  id: string
  thread_id: string
  user_id: string
  stakeholders: Stakeholder[]
  action_items: ActionItem[]
  deadlines: Deadline[]
  key_decisions: KeyDecision[]
  open_questions: OpenQuestion[]
  suggested_reply?: string // Legacy field
  suggested_replies?: SuggestedReply[]
  research?: ResearchResult[]
  created_at: string
}
