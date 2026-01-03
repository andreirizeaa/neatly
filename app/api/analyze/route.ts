import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { runResearchAgent } from "@/lib/research-agent"

export async function POST(request: NextRequest) {
  try {
    const { title, content, userId } = await request.json()

    if (!title || !content || !userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = await createClient()

    // Verify user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user || user.id !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Insert thread
    const { data: thread, error: threadError } = await supabase
      .from("email_threads")
      .insert({
        user_id: userId,
        title,
        content,
      })
      .select()
      .single()

    if (threadError) {
      console.error("Thread error:", threadError)
      return NextResponse.json({ error: "Failed to save thread" }, { status: 500 })
    }

    const mockAnalysis = generateMockAnalysis(content, [])

    // Insert analysis without research
    const { data: analysis, error: analysisError } = await supabase
      .from("analyses")
      .insert({
        thread_id: thread.id,
        user_id: userId,
        ...mockAnalysis,
      })
      .select()
      .single()

    if (analysisError) {
      console.error("Analysis error:", analysisError)
      return NextResponse.json({ error: "Failed to save analysis" }, { status: 500 })
    }

    runResearchInBackground(thread.id, content, userId)

    return NextResponse.json({ threadId: thread.id, analysisId: analysis.id })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function runResearchInBackground(threadId: string, content: string, userId: string) {
  try {
    console.log("Starting background research for thread:", threadId)
    const researchResults = await runResearchAgent(content)
    console.log("Research completed:", researchResults.length, "topics")
    console.log("Research results:", JSON.stringify(researchResults, null, 2))

    // Update the analysis with research results
    const supabase = await createClient()
    const { error } = await supabase
      .from("analyses")
      .update({ research: researchResults })
      .eq("thread_id", threadId)
      .eq("user_id", userId)

    if (error) {
      console.error("Failed to update research:", error)
    } else {
      console.log("Successfully saved research to database")
    }
  } catch (error) {
    console.error("Research background error:", error)
  }
}

function generateMockAnalysis(content: string, researchResults: any[]) {
  const emailMatches = content.match(/[\w.-]+@[\w.-]+\.\w+/g) || []
  const emails = [...new Set(emailMatches)]

  return {
    stakeholders: emails.slice(0, 3).map((email, idx) => ({
      name: email.split("@")[0].replace(/[._]/g, " "),
      email,
      role: ["Project Manager", "Team Lead", "Developer"][idx] || "Participant",
      evidence: "Mentioned in email headers",
    })),
    action_items: [
      {
        description: "Review the proposed changes",
        assignee: emails[0] || "Team",
        priority: "high" as const,
        evidence: "Referenced in discussion",
      },
      {
        description: "Schedule follow-up meeting",
        assignee: emails[1] || "Team",
        priority: "medium" as const,
        evidence: "Mentioned as next step",
      },
      ...(researchResults.length > 0
        ? [
          {
            description: `Review research findings on: ${researchResults.map((r) => r.topic).join(", ")}`,
            assignee: emails[0] || "Team",
            priority: "medium" as const,
            evidence: "Topics identified for further research",
          },
        ]
        : []),
    ],
    deadlines: [
      {
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        description: "Review deadline",
        evidence: "Inferred from context",
      },
    ],
    key_decisions: [
      {
        decision: "Proceed with the proposed approach",
        rationale: "Team consensus reached after discussion",
        evidence: "Multiple positive responses in thread",
      },
    ],
    open_questions: [
      {
        question: "What is the timeline for implementation?",
        context: "Timeline needs clarification",
        evidence: "Not explicitly addressed in thread",
      },
    ],
    suggested_reply:
      "Thank you all for the productive discussion.\n\nBased on our conversation, I understand we've agreed to proceed with the proposed approach. I'll work on reviewing the changes by next week and will schedule a follow-up meeting to discuss the implementation timeline.\n\nPlease let me know if you have any questions or concerns.\n\nBest regards",
    research: researchResults,
  }
}
