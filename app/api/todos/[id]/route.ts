import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const supabase = await createClient()

        // Verify user is authenticated
        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { completed } = await request.json()

        // Update the todo
        const { data: todo, error } = await supabase
            .from("todos")
            .update({
                completed: completed,
                completed_at: completed ? new Date().toISOString() : null,
            })
            .eq("id", id)
            .eq("user_id", user.id)
            .select()
            .single()

        if (error) {
            console.error("Error updating todo:", error)
            return NextResponse.json({ error: "Failed to update todo" }, { status: 500 })
        }

        if (!todo) {
            return NextResponse.json({ error: "Todo not found" }, { status: 404 })
        }

        return NextResponse.json({ todo })
    } catch (error) {
        console.error("API error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
