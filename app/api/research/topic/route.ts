import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { researchSingleTopic } from "@/lib/research-agent"

export async function POST(request: NextRequest) {
  try {
    const { analysisId, topic, context, emailContent } = await request.json()

    const supabase = await createServerClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Research the topic
    const result = await researchSingleTopic(
      topic,
      context || "Email thread context",
      emailContent,
      true, // useWorkflow = true
    )


    // Get current analysis
    const { data: analysis, error: fetchError } = await supabase
      .from("analyses")
      .select("research")
      .eq("id", analysisId)
      .eq("user_id", user.id)
      .single()

    if (fetchError || !analysis) {
      console.error(`[API_RESEARCH] Failed to fetch current analysis: ${analysisId}`, fetchError)
      return NextResponse.json({ error: "Analysis not found" }, { status: 404 })
    }

    const currentResearch = (analysis.research as any[]) || []

    // Update or add this research result
    const updatedResearch = currentResearch.map((r: any) => (r.topic === topic ? result : r))

    // If topic wasn't in the list, add it
    if (!currentResearch.some((r: any) => r.topic === topic)) {
      updatedResearch.push(result)
    }

    // Update the database
    const { error: updateError } = await supabase
      .from("analyses")
      .update({ research: updatedResearch })
      .eq("id", analysisId)
      .eq("user_id", user.id)

    if (updateError) {
      console.error(`[API_RESEARCH] DB Update FAILED for analysis ${analysisId}:`, updateError)
      return NextResponse.json({ error: "Failed to save research" }, { status: 500 })
    }


    return NextResponse.json({ result })
  } catch (error) {
    console.error(`[API_RESEARCH] CRITICAL ERROR in research topic route:`, error)
    return NextResponse.json({ error: "Failed to research topic" }, { status: 500 })
  }
}
