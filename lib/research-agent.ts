import { generateObject } from "ai"
import { z } from "zod"
import { researchModel, topicModel } from "./ai-provider"
import { runWorkflow } from "./workflows/content-research"

import {
  researchTopicSchema,
  formattedBriefSchema,
} from "./schemas"

export async function identifyResearchTopics(emailContent: string): Promise<Array<{ topic: string; context: string; priority: "high" | "medium" | "low" }>> {
  try {
    const { object } = await generateObject({
      model: topicModel,
      schema: researchTopicSchema,
      prompt: `Analyze the following email thread and identify MAXIMUM 5 HIGHLY SPECIFIC research topics or questions.
      
Email thread:
${emailContent}

Return only a flat list of highly relevant, granular research queries.`,
    })

    // Enforce hard cap of 5 topics
    return object.topics.slice(0, 5).map(t => ({
      topic: t,
      context: "Topic identified from thread analysis",
      priority: "high" as const
    }))
  } catch (error) {
    console.error("[TOPICS] Error identifying topics:", error instanceof Error ? error.message : error)
    return []
  }
}



export async function researchSingleTopic(topic: string, context: string, emailContent: string) {
  try {
    console.log(`[RESEARCH] [${topic}] Starting AgentKit SDK workflow...`)

    // Construct the input text for the agent
    const inputText = `
Research request for topic: "${topic}"
Context: ${context}

Original Email Content:
${emailContent}
`
    const workflowResult = await runWorkflow({
      input_as_text: inputText
    })

    console.log(`[RESEARCH] [${topic}] AgentKit SDK workflow SUCCEEDED`)

    // The result is already the structured FormattedBrief
    return {
      ...workflowResult,
      topic: topic
    }
  } catch (error) {
    console.error(`[RESEARCH] [${topic}] CRITICAL ERROR researching topic:`)
    console.error(`[RESEARCH] [${topic}] Error type:`, error?.constructor?.name)
    console.error(`[RESEARCH] [${topic}] Error message:`, error instanceof Error ? error.message : String(error))
    if (error instanceof Error && error.stack) {
      console.error(`[RESEARCH] [${topic}] Stack:`, error.stack)
    }

    // Minimal fallback matching the new schema
    return {
      schema_version: "1.0.0",
      title: `Research: ${topic}`,
      tldr: ["Research could not be completed at this time due to an error."],
      sections: [
        {
          id: "error",
          kind: "custom",
          title: "Status",
          blocks: [
            {
              type: "callout",
              callout_kind: "risk",
              text: "An error occurred while running the research workflow. Please try again later."
            }
          ]
        }
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
  const results = []
  const highPriorityTopics = topics
    .filter((t) => t.priority === "high")
    .slice(0, 5)

  // Execute serially to avoid rate limits
  for (const topic of highPriorityTopics) {
    try {
      const result = await researchSingleTopic(topic.topic, topic.context, emailContent)
      results.push(result)

      // Small delay between requests to be safe
      await new Promise(resolve => setTimeout(resolve, 1000))
    } catch (e) {
      console.error(`[AGENT] Failed to process topic ${topic.topic}`, e)
      // Add error result so UI shows it failed
      results.push({
        schema_version: "1.0.0",
        title: `Research: ${topic.topic}`,
        tldr: ["Research could not be completed."],
        sections: [
          {
            id: "error",
            kind: "custom",
            title: "Status",
            blocks: [
              { type: "callout", callout_kind: "risk", text: "An error occurred. Please retry." }
            ]
          }
        ],
        sources: [],
        topic: topic.topic,
      })
    }
  }

  console.log(`[AGENT] Research cycle completed with ${results.length} results`)

  return results
}
