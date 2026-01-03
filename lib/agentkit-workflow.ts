import type { ResearchResult, FormattedBrief } from "./types"

export interface WorkflowInput {
  emailContent: string
  topic: string
  context?: string
}

export type WorkflowOutput = FormattedBrief

/**
 * Triggers your AgentKit workflow to research a topic
 * @param input - The email content and topic to research
 * @returns The research results from your 2-agent workflow
 */
export async function triggerResearchWorkflow(input: WorkflowInput): Promise<WorkflowOutput> {
  const workflowUrl = process.env.AGENTKIT_WORKFLOW_URL

  if (!workflowUrl) {
    throw new Error("AGENTKIT_WORKFLOW_URL is not configured")
  }

  try {
    const body = {
      input_as_text: input.emailContent,
      topic: input.topic,
      context: input.context || "Email thread analysis",
    }

    const response = await fetch(workflowUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.OPENAI_API_KEY && {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        }),
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Workflow failed: ${response.status} - ${errorText}`)
    }

    const result = await response.json()

    return {
      ...result,
      topic: input.topic,
    }
  } catch (error) {
    console.error(`[WORKFLOW] Execution failed for "${input.topic}":`, error instanceof Error ? error.message : error)
    throw error
  }
}

/**
 * Check the status of a running workflow
 */
export async function checkWorkflowStatus(runId: string) {
  try {
    const response = await fetch(`/api/workflows/status/${runId}`)
    return await response.json()
  } catch (error) {
    console.error("Error checking workflow status:", error)
    return null
  }
}
