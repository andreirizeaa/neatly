import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams
    const topicId = searchParams.get("topicId")

    const supabase = await createClient()

    // Check tables
    const { data: topics, error: topicsError } = await supabase
        .from("research_topics")
        .select("*")
        .limit(5)

    const { data: results, error: resultsError } = await supabase
        .from("research_results")
        .select("*")
        .limit(5)

    // Test the specific join
    let joinData = null
    let joinError = null

    if (topicId) {
        const joinRes = await supabase
            .from("research_topics")
            .select(`
                id,
                title,
                research_results (
                    id,
                    status,
                    content
                )
            `)
            .eq("id", topicId)
            .single()

        joinData = joinRes.data
        joinError = joinRes.error
    }

    return NextResponse.json({
        tables: {
            topics: { count: topics?.length, sample: topics },
            results: { count: results?.length, sample: results },
        },
        errors: {
            topicsError,
            resultsError
        },
        joinTest: {
            topicId,
            data: joinData,
            error: joinError
        }
    })
}
