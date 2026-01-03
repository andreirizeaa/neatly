import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AppHeader } from "@/components/app-header"
import { AnalysisView } from "@/components/analysis-view"

export default async function AnalysisPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect("/auth/login")
  }

  // Fetch thread and analysis
  const { data: thread, error: threadError } = await supabase.from("email_threads").select("*").eq("id", id).single()

  if (threadError || !thread) {
    redirect("/upload")
  }

  const { data: analysis, error: analysisError } = await supabase
    .from("analyses")
    .select("*")
    .eq("thread_id", id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  if (analysisError || !analysis) {
    redirect("/upload")
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader user={user} />
      <main className="container mx-auto px-4 py-8">
        <AnalysisView thread={thread} analysis={analysis} />
      </main>
    </div>
  )
}
