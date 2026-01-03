import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

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
    <div className="flex h-full flex-col gap-4 p-4 overflow-hidden">
      <div>
        <h1 className="text-3xl font-bold mb-2">Analysis History</h1>
        <p className="text-muted-foreground">View and manage your past email thread analyses</p>
      </div>
      <div className="flex-1 min-h-0">
        <HistoryList threads={threads || []} />
      </div>
    </div>
  )
}
