import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ threadId: string }> }) {
  try {
    const { threadId } = await params
    const supabase = await createServerClient()

    // Verify user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch the latest analysis for this thread
    const { data: analysis, error } = await supabase
      .from("analyses")
      .select("research")
      .eq("thread_id", threadId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    console.log("Fetched research for thread:", threadId)
    console.log("Research data:", analysis?.research)

    if (error) {
      console.log("Returning null research due to error")
      return NextResponse.json({ research: null }, { status: 200 })
    }

    return NextResponse.json({ research: analysis.research })
  } catch (error) {
    console.error("Research fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
