import { type NextRequest, NextResponse } from "next/server"

/**
 * Proxy endpoint to trigger your AgentKit workflow
 * This calls your deployed workflow on Vercel
 */
export async function POST(request: NextRequest, { params }: { params: { workflowId: string } }) {
  try {
    const { workflowId } = params
    const body = await request.json()

    console.log("Triggering workflow:", workflowId)
    console.log("Workflow input:", body)

    const workflowEndpoint = process.env.AGENTKIT_WORKFLOW_URL

    if (!workflowEndpoint) {
      console.error("AGENTKIT_WORKFLOW_URL is not configured")
      return NextResponse.json(
        { error: "Workflow service not configured" },
        { status: 503 }
      )
    }

    console.log(`[Proxy] Sending request to external workflow: ${workflowEndpoint}`)
    console.log(`[Proxy] Headers:`, {
      "Content-Type": "application/json",
      Authorization: process.env.OPENAI_API_KEY ? "Bearer ****" : "None",
    })

    const response = await fetch(workflowEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.OPENAI_API_KEY && {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        }),
      },
      body: JSON.stringify(body),
    })

    console.log(`[Proxy] Response status: ${response.status} ${response.statusText}`)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Workflow trigger failed:", errorText)
      throw new Error(`Workflow failed: ${response.status} - ${errorText}`)
    }

    const result = await response.json()

    console.log("Workflow completed successfully")
    console.log("Workflow result:", result)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error triggering workflow:", error)
    return NextResponse.json(
      {
        error: "Failed to trigger workflow",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
