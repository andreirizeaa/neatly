import { researchSingleTopic } from "@/lib/research-agent"
import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export const maxDuration = 300 // Allow up to 5 minutes for single topic research

export async function POST(req: NextRequest) {
    // Define topic outside try/catch for error handling scope
    let topic = ""
    let topicId = ""

    try {
        const body = await req.json()
        const { analysisId, context, emailContent } = body
        topic = body.topic
        topicId = body.topicId

        if (!analysisId || !topic || !topicId || !emailContent) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 },
            )
        }

        const supabase = await createClient()

        // Get user for user_id assignment
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        console.log(`[RESEARCH_PROCESS] Researching topic: "${topic}" (ID: ${topicId})`)

        // Run the actual AgentKit workflow
        const result = await researchSingleTopic(
            topic,
            context || "Email thread analysis",
            emailContent
        )

        console.log(`[RESEARCH_PROCESS] Completed research for "${topic}". Updating DB...`)

        // Upsert into research_results
        // We use upsert to handle potential re-runs safely
        const { error: updateError } = await supabase
            .from("research_results")
            .upsert({
                analysis_id: analysisId,
                topic_id: topicId,
                user_id: user.id, // Add user_id
                content: result,
                status: "completed",
                updated_at: new Date().toISOString(),
            }, { onConflict: "topic_id" })

        if (updateError) {
            console.error(`[RESEARCH_PROCESS] Failed to update DB for topic "${topic}":`, updateError)
        }

        return NextResponse.json({
            success: true,
            result: result
        })
    } catch (error) {
        // Attempt to retrieve topic from request if possible, otherwise use generic
        const topicTitle = topic || "Unknown Topic"
        console.error(`[RESEARCH_PROCESS] Error processing topic "${topicTitle}":`, error)

        // Return a fallback error result structure so frontend doesn't crash
        return NextResponse.json({
            success: false,
            result: {
                schema_version: "1.0.0",
                title: topicTitle,
                tldr: ["Research failed due to server error."],
                sections: [],
                sources: []
            }
        })
    }
}
