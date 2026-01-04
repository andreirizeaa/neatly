import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { ChevronRight, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TopicContent } from "@/components/topic-content"

export default async function TopicPage({
    params,
}: {
    params: Promise<{ id: string; topicId: string }>
}) {
    const { id, topicId } = await params
    const supabase = await createClient()

    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
        redirect("/auth/login")
    }

    // Fetch thread
    const { data: thread, error: threadError } = await supabase
        .from("email_threads")
        .select("*")
        .eq("id", id)
        .single()

    if (threadError || !thread) {
        redirect("/analysis")
    }

    // Fetch the topic with its research result
    const { data: topicData, error: topicError } = await supabase
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

    if (topicError || !topicData) {
        redirect(`/analysis/${id}`)
    }

    // Handle Supabase response which might be array or single object for O2O relation
    const rawResult = topicData.research_results
    const result = Array.isArray(rawResult) ? rawResult[0] : rawResult

    // Ensure content is parsed if it's a string (though it should be JSONB/object)
    const content = typeof result?.content === 'string'
        ? JSON.parse(result.content)
        : result?.content || {}

    const researchItem = {
        id: topicData.id,
        topic: topicData.title,
        ...content,
        // Ensure status falls back correctly
        status: result?.status || "pending",
    }

    return (
        <div className="h-full overflow-auto p-4">
            <div className="space-y-6">
                {/* Header with breadcrumb */}
                <div>
                    {/* Breadcrumb */}
                    <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                        <Link href="/analysis" className="hover:text-foreground transition-colors">
                            Analysis
                        </Link>
                        <ChevronRight className="h-3 w-3" />
                        <Link href={`/analysis/${id}`} className="hover:text-foreground transition-colors">
                            {thread.title}
                        </Link>
                        <ChevronRight className="h-3 w-3" />
                        <span className="text-foreground">{topicData.title}</span>
                    </nav>
                    {/* Title */}
                    <div className="flex items-center gap-4">
                        <Link href={`/analysis/${id}`}>
                            <Button variant="ghost" size="sm">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back
                            </Button>
                        </Link>
                        <p className="text-xl font-semibold">{topicData.title}</p>
                    </div>
                </div>

                <TopicContent researchItem={researchItem} />
            </div>
        </div>
    )
}
