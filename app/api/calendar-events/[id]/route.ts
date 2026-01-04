import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient()
        const { id } = await params

        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()
        const {
            title,
            description,
            startTime,
            endTime,
            allDay,
            color,
            location,
        } = body

        const updateData: Record<string, unknown> = {}
        if (title !== undefined) updateData.title = title
        if (description !== undefined) updateData.description = description
        if (startTime !== undefined) updateData.start_time = startTime
        if (endTime !== undefined) updateData.end_time = endTime
        if (allDay !== undefined) updateData.all_day = allDay
        if (color !== undefined) updateData.color = color
        if (location !== undefined) updateData.location = location

        const { data: event, error } = await supabase
            .from("calendar_events")
            .update(updateData)
            .eq("id", id)
            .eq("user_id", user.id)
            .select()
            .single()

        if (error) {
            console.error("Error updating calendar event:", error)
            return NextResponse.json({ error: "Failed to update event" }, { status: 500 })
        }

        return NextResponse.json({ event })
    } catch (error) {
        console.error("API error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient()
        const { id } = await params

        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { error } = await supabase
            .from("calendar_events")
            .delete()
            .eq("id", id)
            .eq("user_id", user.id)

        if (error) {
            console.error("Error deleting calendar event:", error)
            return NextResponse.json({ error: "Failed to delete event" }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("API error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
