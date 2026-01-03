import { generateObject } from "ai"
import { z } from "zod"
import { triggerResearchWorkflow } from "./agentkit-workflow"
import { researchModel, topicModel } from "./ai-provider"

const researchTopicSchema = z.object({
  topics: z.array(z.string().describe("A specific research topic or question")),
})

const citationSchema = z.object({
  source_id: z.string(),
  note: z.string().nullable(),
})

const sourceSchema = z.object({
  id: z.string(),
  title: z.string(),
  url: z.string(),
  publisher: z.string().nullable(),
  published_date: z.string().nullable(),
  accessed_date: z.string().nullable(),
  notes: z.string().nullable(),
})

const bulletItemSchema = z.object({
  text: z.string(),
  citations: z.array(citationSchema).nullable(),
})

const definitionItemSchema = z.object({
  term: z.string(),
  definition: z.string(),
  citations: z.array(citationSchema).nullable(),
})

const qaItemSchema = z.object({
  q: z.string(),
  a: z.string(),
  citations: z.array(citationSchema).nullable(),
})

const tableCellSchema = z.object({
  value: z.union([z.string(), z.number(), z.boolean(), z.null()]),
  citations: z.array(citationSchema).nullable(),
})

const tableSchema = z.object({
  caption: z.string().nullable(),
  columns: z.array(z.object({ key: z.string(), label: z.string() })),
  rows: z.array(z.array(tableCellSchema)),
})

const blockSchema = z.object({
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

const sectionSchema = z.object({
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

const formattedBriefSchema = z.object({
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

export async function identifyResearchTopics(emailContent: string): Promise<Array<{ topic: string; context: string; priority: "high" | "medium" | "low" }>> {
  try {
    const { object } = await generateObject({
      model: topicModel,
      schema: researchTopicSchema,
      prompt: `Analyze the following email thread and identify 3-5 HIGHLY SPECIFIC research topics or questions.
      
Email thread:
${emailContent}

Return only a flat list of highly relevant, granular research queries.`,
    })

    return object.topics.map(t => ({
      topic: t,
      context: "Topic identified from thread analysis",
      priority: "high" as const
    }))
  } catch (error) {
    console.error("[TOPICS] Error identifying topics:", error instanceof Error ? error.message : error)
    return []
  }
}

export async function researchSingleTopic(topic: string, context: string, emailContent?: string, useWorkflow = true) {
  try {
    if (useWorkflow && emailContent && process.env.AGENTKIT_WORKFLOW_URL) {
      try {
        const workflowResult = await triggerResearchWorkflow({
          emailContent,
          topic,
          context,
        })
        return workflowResult
      } catch (workflowError) {
        console.error(`[RESEARCH] Workflow failed for "${topic}", falling back to local AI`)
        // Continue to fallback logic below
      }
    }

    const { object: researchContent } = await generateObject({
      model: researchModel,
      schema: formattedBriefSchema,
      prompt: `You are an expert research assistant. Provide a high-fidelity, structured research brief about this topic.

TOPIC: ${topic}
CONTEXT: ${context}

Create a FormattedBrief with:
1. schema_version: "1.0.0"
2. A compelling title and subtitle
3. A tldr (up to 5 bullet points)
4. Structured sections (at least 3) using various block types:
   - Use 'what_it_is' or 'why_it_matters' for introductory context
   - Use 'key_points' or 'numbers' for the core data
   - Use 'risks_mitigations' or 'recommendations' for actionable takeaways
   - Include at least one table or callout if relevant
5. At least 3 credible sources with reachable URLs.
6. Proper citations within blocks that reference the IDs in the sources array.

Citations should be used to link specific claims or data points to the IDs in the sources list.`,
    })

    return {
      ...researchContent,
      topic: topic,
    }
  } catch (error) {
    console.error(`[RESEARCH] Error researching "${topic}":`, error instanceof Error ? error.message : error)

    // Minimal fallback matching the new schema
    return {
      schema_version: "1.0.0",
      title: `Research: ${topic}`,
      tldr: ["Research could not be completed at this time."],
      sections: [
        {
          id: "error",
          kind: "custom",
          title: "Status",
          blocks: [
            {
              type: "paragraph",
              text: "An error occurred during research. Please check your AI provider configuration.",
            },
          ],
        },
      ],
      sources: [],
      topic: topic,
    }
  }
}

export async function runResearchAgent(emailContent: string) {
  console.log("[AGENT] Starting full research cycle...")

  const topics = await identifyResearchTopics(emailContent)

  if (topics.length === 0) {
    console.log("[AGENT] No research topics identified - returning empty")
    return []
  }

  console.log(`[AGENT] Processing ${topics.length} topics concurrently...`)

  // Research high priority topics (up to 5)
  const researchPromises = topics
    .filter((t) => t.priority === "high")
    .slice(0, 5)
    .map((topic) => researchSingleTopic(topic.topic, topic.context, emailContent))

  const results = await Promise.all(researchPromises)

  console.log(`[AGENT] Research cycle completed with ${results.length} results`)

  return results
}
