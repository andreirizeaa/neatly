import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { runResearchAgent } from "@/lib/research-agent"
import { generateObject } from "ai"
import { topicModel } from "@/lib/ai-provider"
import { emailAnalysisSchema } from "@/lib/schemas"

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

    // Call ChatGPT to analyze the email thread
    console.log("[ANALYSIS] Starting email analysis with ChatGPT...")
    const analysisResult = await analyzeEmailThread(content)
    console.log("[ANALYSIS] Analysis complete")

    // Insert analysis with just the suggested reply
    const { data: analysis, error: analysisError } = await supabase
      .from("analyses")
      .insert({
        thread_id: thread.id,
        user_id: userId,
        suggested_reply: analysisResult.suggested_reply,
      })
      .select()
      .single()

    if (analysisError) {
      console.error("Analysis error:", analysisError)
      return NextResponse.json({ error: "Failed to save analysis" }, { status: 500 })
    }

    // Insert normalized entities in parallel
    const insertPromises = []

    if (analysisResult.stakeholders.length > 0) {
      insertPromises.push(
        supabase.from("stakeholders").insert(
          analysisResult.stakeholders.map(s => ({ ...s, analysis_id: analysis.id, user_id: userId }))
        )
      )
    }

    if (analysisResult.action_items.length > 0) {
      insertPromises.push(
        supabase.from("action_items").insert(
          analysisResult.action_items.map(a => ({ ...a, analysis_id: analysis.id, user_id: userId }))
        )
      )
    }

    if (analysisResult.deadlines.length > 0) {
      insertPromises.push(
        supabase.from("deadlines").insert(
          analysisResult.deadlines.map(d => ({ ...d, analysis_id: analysis.id, user_id: userId }))
        )
      )
    }

    if (analysisResult.key_decisions.length > 0) {
      insertPromises.push(
        supabase.from("key_decisions").insert(
          analysisResult.key_decisions.map(k => ({ ...k, analysis_id: analysis.id, user_id: userId }))
        )
      )
    }

    if (analysisResult.open_questions.length > 0) {
      insertPromises.push(
        supabase.from("open_questions").insert(
          analysisResult.open_questions.map(q => ({ ...q, analysis_id: analysis.id, user_id: userId }))
        )
      )
    }

    // Create todos from action items
    if (analysisResult.action_items.length > 0) {
      insertPromises.push(
        supabase.from("todos").insert(
          analysisResult.action_items.map(a => ({
            description: a.description,
            assignee: a.assignee,
            priority: a.priority,
            analysis_id: analysis.id,
            thread_id: thread.id,
            user_id: userId,
            completed: false,
          }))
        )
      )
    }

    await Promise.all(insertPromises)

    // Run research in the background (does not block response)
    runResearchInBackground(thread.id, content, userId)

    // Return the result with the ID
    return NextResponse.json({
      success: true,
      threadId: thread.id,
      analysisId: analysis.id,
      redirectUrl: `/analysis/${thread.id}?source=analyze`
    })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * Analyze an email thread using ChatGPT with strict JSON schema
 */
async function analyzeEmailThread(content: string) {
  try {
    const { object } = await generateObject({
      model: topicModel,
      schema: emailAnalysisSchema,
      prompt: `You are an expert email analyst. Analyze the following email thread and extract structured information.

Email Thread:
${content}

Instructions:
1. Identify all stakeholders mentioned in the email (senders, recipients, people referenced)
2. Extract actionable items - tasks that someone needs to complete
3. Find any deadlines or dates mentioned
4. Identify key decisions that were made or proposed
5. Note any open questions that remain unanswered
6. Generate a professional, contextual reply that addresses the main points

Be thorough but only include items that are actually present in the email. If a category has no items, return an empty array for that field.
For priorities: use "high" for urgent/time-sensitive items, "medium" for important but not urgent, "low" for nice-to-have or minor items.
For the suggested reply, write a professional email that would be appropriate to send as a response to this thread.`,
    })

    return object
  } catch (error) {
    console.error("[ANALYSIS] Error analyzing email:", error instanceof Error ? error.message : error)

    // Return minimal fallback if AI fails
    return {
      stakeholders: [],
      action_items: [],
      deadlines: [],
      key_decisions: [],
      open_questions: [],
      suggested_reply: "Thank you for your email. I will review and respond shortly.",
    }
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
