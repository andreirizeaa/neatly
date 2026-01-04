import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { HomeDashboard } from "@/components/home-dashboard"

export default async function HomePage() {
    const supabase = await createClient()

    const {
        data: { user },
        error,
    } = await supabase.auth.getUser()
    if (error || !user) {
        redirect("/auth/login")
    }

    // Fetch all the dashboard data in parallel
    const [
        { count: totalAnalyses },
        { data: recentAnalyses },
        { data: pendingTodos, count: pendingTodosCount },
        { count: upcomingEventsCount },
    ] = await Promise.all([
        // Total analyses count
        supabase
            .from("email_threads")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id),

        // Recent analyses (last 5)
        supabase
            .from("email_threads")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(5),

        // Pending todos (incomplete, ordered by priority)
        supabase
            .from("todos")
            .select(`
        *,
        email_threads(title)
      `, { count: "exact" })
            .eq("user_id", user.id)
            .eq("completed", false)
            .order("priority", { ascending: true })
            .limit(5),

        // Upcoming events count (next 7 days)
        supabase
            .from("calendar_events")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id)
            .gte("start_time", new Date().toISOString())
            .lte("start_time", new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()),
    ])

    // Transform todos to flatten the joined data
    const transformedTodos = (pendingTodos || []).map((todo: any) => ({
        ...todo,
        thread_title: todo.email_threads?.title || "Unknown Thread",
        email_threads: undefined,
    }))

    const stats = {
        totalAnalyses: totalAnalyses || 0,
        pendingTodos: pendingTodosCount || 0,
        upcomingEvents: upcomingEventsCount || 0,
    }

    return (
        <div className="flex h-full flex-col p-4 overflow-hidden">
            <HomeDashboard
                stats={stats}
                recentAnalyses={recentAnalyses || []}
                pendingTodos={transformedTodos}
            />
        </div>
    )
}
