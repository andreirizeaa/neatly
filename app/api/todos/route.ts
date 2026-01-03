import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()

        // Verify user is authenticated
        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Fetch all active (incomplete) todos for the user
        // Join with email_threads to get the thread title
        const { data: todos, error } = await supabase
            .from("todos")
            .select(`
        *,
        email_threads(title)
      `)
            .eq("user_id", user.id)
            .eq("completed", false)
            .order("priority", { ascending: true })
            .order("created_at", { ascending: false })

        if (error) {
            console.error("Error fetching todos:", error)
            return NextResponse.json({ error: "Failed to fetch todos" }, { status: 500 })
        }

        // Transform to flatten the joined data
        const transformedTodos = todos.map((todo: any) => ({
            ...todo,
            thread_title: todo.email_threads?.title || "Unknown Thread",
            email_threads: undefined,
        }))

        return NextResponse.json({ todos: transformedTodos })
    } catch (error) {
        console.error("API error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
