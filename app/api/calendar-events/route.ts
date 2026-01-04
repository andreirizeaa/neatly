import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
    try {
        const supabase = await createClient()

        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { data: events, error } = await supabase
            .from("calendar_events")
            .select("*")
            .eq("user_id", user.id)
            .order("start_time", { ascending: true })

        if (error) {
            console.error("Error fetching calendar events:", error)
            return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 })
        }

        return NextResponse.json({ events })
    } catch (error) {
        console.error("API error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()

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
            analysisId,
            threadId,
            sourceType,
            sourceEvidence,
        } = body

        if (!title || !startTime || !endTime) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }

        const { data: event, error } = await supabase
            .from("calendar_events")
            .insert({
                user_id: user.id,
                title,
                description: description || null,
                start_time: startTime,
                end_time: endTime,
                all_day: allDay || false,
                color: color || "sky",
                location: location || null,
                analysis_id: analysisId || null,
                thread_id: threadId || null,
                source_type: sourceType || "manual",
                source_evidence: sourceEvidence || null,
            })
            .select()
            .single()

        if (error) {
            console.error("Error creating calendar event:", error)
            return NextResponse.json({ error: "Failed to create event" }, { status: 500 })
        }

        return NextResponse.json({ event })
    } catch (error) {
        console.error("API error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
