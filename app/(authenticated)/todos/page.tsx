import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { TodoList } from "@/components/todo-list"

export default async function TodosPage() {
    const supabase = await createClient()

    const {
        data: { user },
        error,
    } = await supabase.auth.getUser()
    if (error || !user) {
        redirect("/auth/login")
    }

    // Fetch all todos for the user with thread title
    const { data: todos, error: todosError } = await supabase
        .from("todos")
        .select(`
      *,
      email_threads(title)
    `)
        .eq("user_id", user.id)
        .order("priority", { ascending: true })
        .order("created_at", { ascending: false })

    if (todosError) {
        console.error("Error fetching todos:", todosError)
    }

    // Transform to flatten the joined data
    const transformedTodos = (todos || []).map((todo: any) => ({
        ...todo,
        thread_title: todo.email_threads?.title || "Unknown Thread",
        email_threads: undefined,
    }))

    return (
        <div className="flex h-full flex-col gap-4 p-4 overflow-hidden">
            <div>
                <h1 className="text-3xl font-bold mb-2">To Do</h1>
                <p className="text-muted-foreground">Track and complete actionable items from your analyses</p>
            </div>
            <div className="flex-1 min-h-0">
                <TodoList todos={transformedTodos} />
            </div>
        </div>
    )
}
