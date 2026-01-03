import { identifyResearchTopics } from "@/lib/research-agent"
import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
    try {
        const { analysisId, emailContent } = await req.json()

        if (!analysisId || !emailContent) {
            return NextResponse.json(
                { error: "Missing required fields: analysisId, emailContent" },
                { status: 400 },
            )
        }

        const supabase = await createClient()

        // Get user for user_id assignment
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        console.log(`[RESEARCH_IDENTIFY] Identifying topics for analysis: ${analysisId}`)
        const topics = await identifyResearchTopics(emailContent)
        console.log(`[RESEARCH_IDENTIFY] Identified ${topics.length} topics`)

        // Save topics to database immediately as pending in research_topics
        const topicInserts = topics.map((t) => ({
            analysis_id: analysisId,
            user_id: user.id, // Add user_id
            title: t.topic,
        }))

        const { data: insertedTopics, error: insertError } = await supabase
            .from("research_topics")
            .insert(topicInserts)
            .select()

        if (insertError) {
            console.error("[RESEARCH_IDENTIFY] Error inserting topics:", insertError)
        }

        // Map back to format expected by frontend, but include IDs
        // We try to match inserted topics with original topics to preserve context if any
        // Use inserted ID if available, otherwise we can't drive the process correctly
        const resultTopics = insertedTopics ? insertedTopics.map((it: any) => ({
            id: it.id,
            topic: it.title,
            context: "Email thread analysis",
            priority: "medium",
            isLoading: true
        })) : [] // If insert failed, we return empty or handle error on frontend? Returning empty stops process safely.

        if (!insertedTopics) {
            console.error("[RESEARCH_IDENTIFY] Failed to get IDs for inserted topics, cannot proceed.")
        }

        // Return the topics so frontend can display them and start processing loop
        return NextResponse.json({
            success: true,
            count: resultTopics.length,
            topics: resultTopics
        })
    } catch (error) {
        console.error("[RESEARCH_IDENTIFY] Error identifying topics:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        )
    }
}
