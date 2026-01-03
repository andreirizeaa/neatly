import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AppHeader } from "@/components/app-header"
import { HistoryList } from "@/components/history-list"

export default async function HistoryPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) {
    redirect("/auth/login")
  }

  // Fetch all threads for the user
  const { data: threads, error: threadsError } = await supabase
    .from("email_threads")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (threadsError) {
    console.error("Error fetching threads:", threadsError)
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader user={user} />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Analysis History</h1>
            <p className="text-muted-foreground">View and manage your past email thread analyses</p>
          </div>
          <HistoryList threads={threads || []} />
        </div>
      </main>
    </div>
  )
}
