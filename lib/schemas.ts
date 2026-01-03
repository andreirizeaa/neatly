import { z } from "zod"

export const researchTopicSchema = z.object({
    topics: z.array(z.string().describe("A specific research topic or question")),
})

export const citationSchema = z.object({
    source_id: z.string(),
    note: z.string().nullable(),
})

export const sourceSchema = z.object({
    id: z.string(),
    title: z.string(),
    url: z.string(),
    publisher: z.string().nullable(),
    published_date: z.string().nullable(),
    accessed_date: z.string().nullable(),
    notes: z.string().nullable(),
})

export const bulletItemSchema = z.object({
    text: z.string(),
    citations: z.array(citationSchema).nullable(),
})

export const definitionItemSchema = z.object({
    term: z.string(),
    definition: z.string(),
    citations: z.array(citationSchema).nullable(),
})

export const qaItemSchema = z.object({
    q: z.string(),
    a: z.string(),
    citations: z.array(citationSchema).nullable(),
})

export const tableCellSchema = z.object({
    value: z.union([z.string(), z.number(), z.boolean(), z.null()]),
    citations: z.array(citationSchema).nullable(),
})

export const tableSchema = z.object({
    caption: z.string().nullable(),
    columns: z.array(z.object({ key: z.string(), label: z.string() })),
    rows: z.array(z.array(tableCellSchema)),
})

export const blockSchema = z.object({
    type: z.enum(["heading", "paragraph", "bullets", "table", "callout", "definition_list", "qa_list", "divider"]),
    text: z.string().nullable(),
    level: z.number().nullable(),
    items: z.array(bulletItemSchema).nullable(),
    definitions: z.array(definitionItemSchema).nullable(),
    questions: z.array(qaItemSchema).nullable(),
    table: tableSchema.nullable(),
    callout_kind: z.enum(["info", "warning", "risk", "tip", "note"]).nullable(),
    citations: z.array(citationSchema).nullable(),
})

export const sectionSchema = z.object({
    id: z.string(),
    kind: z.enum([
        "why_it_matters",
        "what_it_is",
        "key_points",
        "whats_new",
        "numbers",
        "pros_cons",
        "risks_mitigations",
        "recommendations",
        "faq",
        "custom",
    ]),
    title: z.string(),
    summary: z.string().nullable(),
    blocks: z.array(blockSchema),
})

export const formattedBriefSchema = z.object({
    schema_version: z.string(),
    title: z.string(),
    subtitle: z.string().nullable(),
    topic: z.string().nullable(),
    audience: z.string().nullable(),
    tone: z.string().nullable(),
    tldr: z.array(z.string()).max(5),
    sections: z.array(sectionSchema),
    sources: z.array(sourceSchema),
})

// Email Analysis Schema for structured extraction
export const stakeholderSchema = z.object({
    name: z.string().describe("Full name of the stakeholder"),
    email: z.string().describe("Email address if available, or empty string"),
    role: z.string().describe("Role or position inferred from context"),
    evidence: z.string().describe("Quote or context from the email that identifies this stakeholder"),
})

export const actionItemSchema = z.object({
    description: z.string().describe("Clear, actionable description of the task"),
    assignee: z.string().describe("Person or team responsible, or 'Unassigned' if unclear"),
    priority: z.enum(["high", "medium", "low"]).describe("Priority level based on urgency and importance"),
    evidence: z.string().describe("Quote or context from the email that identifies this action item"),
})

export const deadlineSchema = z.object({
    date: z.string().describe("ISO 8601 date string, or descriptive text if exact date not specified"),
    description: z.string().describe("What the deadline is for"),
    evidence: z.string().describe("Quote or context from the email mentioning this deadline"),
})

export const keyDecisionSchema = z.object({
    decision: z.string().describe("The decision that was made"),
    rationale: z.string().describe("Why this decision was made"),
    evidence: z.string().describe("Quote or context from the email about this decision"),
})

export const openQuestionSchema = z.object({
    question: z.string().describe("The unanswered question"),
    context: z.string().describe("Why this question matters"),
    evidence: z.string().describe("Context from the email thread"),
})

export const emailAnalysisSchema = z.object({
    stakeholders: z.array(stakeholderSchema).describe("People involved in the email thread"),
    action_items: z.array(actionItemSchema).describe("Tasks or actions that need to be completed"),
    deadlines: z.array(deadlineSchema).describe("Any dates or deadlines mentioned"),
    key_decisions: z.array(keyDecisionSchema).describe("Decisions that were made in the thread"),
    open_questions: z.array(openQuestionSchema).describe("Questions that remain unanswered"),
    suggested_reply: z.string().describe("A professional, contextual reply email that addresses the key points"),
})

