import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { History, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

import { AnalysisDashboard } from "@/components/analysis-dashboard"

export default async function AnalysisPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { id } = await params
  const { source } = await searchParams
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect("/auth/login")
  }

  // Fetch thread and analysis
  const { data: thread, error: threadError } = await supabase
    .from("email_threads")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single()

  if (threadError || !thread) {
    redirect("/new")
  }

  // Fetch analysis with all its normalized relations
  const { data: rawAnalysis, error: analysisError } = await supabase
    .from("analyses")
    .select(`
      *,
      stakeholders(*),
      action_items(*),
      deadlines(*),
      key_decisions(*),
      open_questions(*)
    `)
    .eq("thread_id", id)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  if (analysisError || !rawAnalysis) {
    redirect("/new")
  }

  // Fetch topics and their results separately
  const { data: topicsData, error: topicsError } = await supabase
    .from("research_topics")
    .select(`
      id,
      title,
      is_loading,
      research_results (
        id,
        status,
        content
      )
    `)
    .eq("analysis_id", rawAnalysis.id)
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })

  if (topicsError) {
    console.error("Error fetching research topics:", topicsError)
  }

  // Map the relational data to the expected format
  const analysis = {
    ...rawAnalysis,
    research: topicsData && topicsData.length > 0
      ? topicsData.map((topicItem: any) => {
        const result = topicItem.research_results?.[0]
        const content = result?.content || {}
        return {
          id: topicItem.id,
          topic: topicItem.title,
          ...content,
          status: result?.status || "pending",
          isLoading: topicItem.is_loading // Use database column for loading state
        }
      })
      : []
  }

  const analysisDate = new Date(rawAnalysis.created_at).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  return (
    <div className="flex flex-col h-full overflow-hidden p-4 gap-4">
      {/* Header with breadcrumb and history button */}
      <div className="flex-none flex items-start justify-between">
        <div>
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
            <Link href="/analysis" className="hover:text-foreground transition-colors">
              Analysis
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground">{thread.title}</span>
          </nav>
          {/* Title */}
          <h1 className="text-3xl font-bold">{thread.title}</h1>
        </div>
        {/* Right side: date and history button */}
        <div className="flex items-center gap-4">
          <p className="text-sm text-muted-foreground">Analyzed on {analysisDate}</p>
          <Link href="/analysis">
            <Button variant="outline" size="sm">
              <History className="h-4 w-4 mr-2" />
              All Analyses
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <AnalysisDashboard thread={thread} analysis={analysis} />
      </div>
    </div>
  )
}

