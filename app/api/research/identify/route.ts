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

        console.log(`[RESEARCH_IDENTIFY] Checking for existing topics for analysis: ${analysisId}`)

        // Check for existing topics first
        const { data: existingTopics, error: fetchError } = await supabase
            .from("research_topics")
            .select(`
                id,
                title,
                is_loading,
                created_at,
                research_results (
                    id,
                    content
                )
            `)
            .eq("analysis_id", analysisId)
            .order("created_at", { ascending: true })

        if (fetchError) {
            console.error("[RESEARCH_IDENTIFY] Error fetching existing topics:", fetchError)
        }

        // If we have existing topics, return them with their status
        if (existingTopics && existingTopics.length > 0) {
            console.log(`[RESEARCH_IDENTIFY] Found ${existingTopics.length} existing topics`)

            const resultTopics = existingTopics.map((topic: any) => {
                const hasResult = topic.research_results && topic.research_results.length > 0
                const result = hasResult ? topic.research_results[0] : null

                // Extract tldr from content if available
                let tldr = undefined
                if (result && result.content) {
                    try {
                        const content = typeof result.content === 'string'
                            ? JSON.parse(result.content)
                            : result.content
                        if (content.tldr) tldr = content.tldr
                    } catch (e) {
                        // ignore parse error
                    }
                }

                return {
                    id: topic.id,
                    topic: topic.title,
                    context: "Email thread analysis",
                    priority: "medium",
                    isLoading: topic.is_loading, // Use database column for loading state
                    tldr: tldr
                }
            })

            return NextResponse.json({
                success: true,
                count: resultTopics.length,
                topics: resultTopics
            })
        }

        console.log(`[RESEARCH_IDENTIFY] No existing topics found. Generating new ones...`)
        const topics = await identifyResearchTopics(emailContent)
        console.log(`[RESEARCH_IDENTIFY] Identified ${topics.length} topics`)

        // Save topics to database immediately as pending in research_topics
        const topicInserts = topics.map((t) => ({
            analysis_id: analysisId,
            user_id: user.id,
            title: t.topic,
            is_loading: true, // Explicitly set loading state
        }))

        const { data: insertedTopics, error: insertError } = await supabase
            .from("research_topics")
            .insert(topicInserts)
            .select()

        if (insertError) {
            console.error("[RESEARCH_IDENTIFY] Error inserting topics:", insertError)
        }

        // Map back to format expected by frontend, but include IDs
        const resultTopics = insertedTopics ? insertedTopics.map((it: any) => ({
            id: it.id,
            topic: it.title,
            context: "Email thread analysis",
            priority: "medium",
            isLoading: true
        })) : []

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
