import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { identifyResearchTopics } from "@/lib/research-agent"

export async function GET(request: NextRequest, { params }: { params: Promise<{ analysisId: string }> }) {
  console.log("[API_TOPICS] Request received for analysisId route")
  try {
    const { analysisId } = await params
    console.log(`[API_TOPICS] Parameters parsed. analysisId: ${analysisId}`)
    const supabase = await createServerClient()

    // Get the user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the analysis and join with thread
    console.log(`[API_TOPICS] Querying Supabase for analysisId: ${analysisId}`)
    const { data: analysis, error: analysisError } = await supabase
      .from("analyses")
      .select("*, thread:email_threads(*)")
      .eq("id", analysisId)
      .eq("user_id", user.id)
      .single()

    if (analysisError || !analysis) {
      console.error(`[API_TOPICS] DB Error or Missing Record: ${analysisId}`, analysisError)
      return NextResponse.json({
        error: "Analysis not found",
        debug: { analysisId, user: user.id }
      }, { status: 404 })
    }

    const thread = analysis.thread as any

    if (!thread) {
      console.error(`[API_TOPICS] Thread not found for analysis: ${analysisId}`)
      return NextResponse.json({ error: "Thread not found" }, { status: 404 })
    }

    // Check if we already have research results saved
    if (analysis.research && (analysis.research as any[]).length > 0) {
      console.log(`[API_TOPICS] CACHE HIT for analysis ${analysisId}: ${analysis.research.length} topics found`)
      return NextResponse.json({ topics: analysis.research })
    }

    console.log(`[API_TOPICS] CACHE MISS for analysis ${analysisId}: Starting fresh identification`)

    // Identify topics
    const topics = await identifyResearchTopics(thread.content)

    console.log(`[API_TOPICS] Topics identified for analysis ${analysisId}:`, topics.length)

    // Return topics only (no research yet)
    const topicsForResearch = topics.slice(0, 5).map((t) => ({
      topic: t.topic,
      findings: [],
      synthesis: "",
      isLoading: true,
    }))

    return NextResponse.json({ topics: topicsForResearch })
  } catch (error) {
    console.error(`[API_TOPICS] ERROR identifying topics:`, error)
    return NextResponse.json({ error: "Failed to identify topics" }, { status: 500 })
  }
}
