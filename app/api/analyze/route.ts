import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
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

    // Insert analysis with suggested replies
    const { data: analysis, error: analysisError } = await supabase
      .from("analyses")
      .insert({
        thread_id: thread.id,
        user_id: userId,
        suggested_replies: analysisResult.suggested_replies,
        // Keep suggested_reply for backward compatibility (use the first one)
        suggested_reply: analysisResult.suggested_replies?.[0]?.content || "",
      })
      .select()
      .single()

    if (analysisError || !analysis) {
      console.error("Analysis insert error:", analysisError)
      return NextResponse.json({ error: "Failed to save analysis" }, { status: 500 })
    }

    // ... (keeping the previous analysis insert logic)

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

    // Create calendar events from deadlines
    if (analysisResult.deadlines.length > 0) {
      const calendarEvents = await parseDeadlinesToCalendarEvents(
        analysisResult.deadlines,
        analysis.id,
        thread.id,
        userId,
        title
      )
      if (calendarEvents.length > 0) {
        insertPromises.push(
          supabase.from("calendar_events").insert(calendarEvents)
        )
      }
    }

    await Promise.all(insertPromises)

    // Return the result with the ID
    // Research topics will be identified by the frontend via /api/research/identify
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
6. Generate 3 distinct suggested replies:
   - One "Brief" reply (concise acknowledgment)
   - One "Detailed" reply (addressing all points thoroughly)
   - One "Question-focused" reply (asking clarifying questions) or alternative tone as appropriate

Be thorough but only include items that are actually present in the email. If a category has no items, return an empty array for that field.
For priorities: use "high" for urgent/time-sensitive items, "medium" for important but not urgent, "low" for nice-to-have or minor items.`,
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
      suggested_replies: [{ title: "Default Reply", content: "Thank you for your email. I will review and respond shortly." }],
      suggested_reply: "Thank you for your email. I will review and respond shortly.",
    }
  }
}

interface DeadlineInput {
  date: string
  description: string
  evidence: string
}

interface CalendarEventInsert {
  user_id: string
  analysis_id: string
  thread_id: string
  title: string
  description: string
  start_time: string
  end_time: string
  all_day: boolean
  color: string
  source_type: string
  source_evidence: string
}

/**
 * Parse deadline strings into calendar events with actual timestamps
 */
async function parseDeadlinesToCalendarEvents(
  deadlines: DeadlineInput[],
  analysisId: string,
  threadId: string,
  userId: string,
  emailTitle: string
): Promise<CalendarEventInsert[]> {
  const today = new Date().toISOString().split('T')[0]
  const colors = ['sky', 'amber', 'violet', 'rose', 'emerald', 'orange']

  const calendarEvents: CalendarEventInsert[] = []

  for (const deadline of deadlines) {
    try {
      // Try to parse the date - it may be ISO format or descriptive text
      let eventDate: Date | null = null

      // Try ISO format first
      const isoDate = new Date(deadline.date)
      if (!isNaN(isoDate.getTime())) {
        eventDate = isoDate
      } else {
        // Try to parse descriptive dates using simple patterns
        eventDate = parseDescriptiveDate(deadline.date, today)
      }

      if (eventDate) {
        // Create an all-day event for the deadline
        const startOfDay = new Date(eventDate)
        startOfDay.setHours(9, 0, 0, 0)

        const endOfDay = new Date(eventDate)
        endOfDay.setHours(17, 0, 0, 0)

        calendarEvents.push({
          user_id: userId,
          analysis_id: analysisId,
          thread_id: threadId,
          title: deadline.description || `Deadline: ${emailTitle}`,
          description: `From email: "${emailTitle}"\n\nOriginal deadline: ${deadline.date}`,
          start_time: startOfDay.toISOString(),
          end_time: endOfDay.toISOString(),
          all_day: true,
          color: colors[calendarEvents.length % colors.length],
          source_type: 'deadline',
          source_evidence: deadline.evidence,
        })
      }
    } catch (error) {
      console.error("Failed to parse deadline:", deadline, error)
    }
  }

  return calendarEvents
}

/**
 * Parse common date patterns into actual Date objects
 */
function parseDescriptiveDate(dateStr: string, referenceDate: string): Date | null {
  const lower = dateStr.toLowerCase().trim()
  const today = new Date(referenceDate)

  // Handle "today", "tomorrow", "next week" etc.
  if (lower === 'today') {
    return today
  }
  if (lower === 'tomorrow') {
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow
  }
  if (lower.includes('next week')) {
    const nextWeek = new Date(today)
    nextWeek.setDate(nextWeek.getDate() + 7)
    return nextWeek
  }
  if (lower.includes('next month')) {
    const nextMonth = new Date(today)
    nextMonth.setMonth(nextMonth.getMonth() + 1)
    return nextMonth
  }

  // Try to parse dates like "January 10", "Jan 10th", "10 January"
  const months = [
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december'
  ]
  const monthsShort = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']

  for (let i = 0; i < months.length; i++) {
    const fullMonth = months[i]
    const shortMonth = monthsShort[i]

    // Match patterns like "January 10", "Jan 10th", "10th January"
    const patterns = [
      new RegExp(`${fullMonth}\\s+(\\d{1,2})(?:st|nd|rd|th)?`, 'i'),
      new RegExp(`${shortMonth}\\s+(\\d{1,2})(?:st|nd|rd|th)?`, 'i'),
      new RegExp(`(\\d{1,2})(?:st|nd|rd|th)?\\s+(?:of\\s+)?${fullMonth}`, 'i'),
      new RegExp(`(\\d{1,2})(?:st|nd|rd|th)?\\s+(?:of\\s+)?${shortMonth}`, 'i'),
    ]

    for (const pattern of patterns) {
      const match = lower.match(pattern)
      if (match) {
        const day = parseInt(match[1], 10)
        if (day >= 1 && day <= 31) {
          const year = today.getMonth() > i ? today.getFullYear() + 1 : today.getFullYear()
          return new Date(year, i, day)
        }
      }
    }
  }

  // Try to parse MM/DD or DD/MM patterns
  const slashMatch = lower.match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/)
  if (slashMatch) {
    const num1 = parseInt(slashMatch[1], 10)
    const num2 = parseInt(slashMatch[2], 10)
    const year = slashMatch[3] ? (slashMatch[3].length === 2 ? 2000 + parseInt(slashMatch[3], 10) : parseInt(slashMatch[3], 10)) : today.getFullYear()

    // Assume MM/DD format (US style)
    if (num1 >= 1 && num1 <= 12 && num2 >= 1 && num2 <= 31) {
      return new Date(year, num1 - 1, num2)
    }
  }

  return null
}
