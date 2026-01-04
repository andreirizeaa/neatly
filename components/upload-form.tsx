"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Sparkles } from "lucide-react"

interface UploadFormProps {
  userId: string
}

export function UploadForm({ userId }: UploadFormProps) {
  // Generate dates relative to today for the default email thread
  const getRelativeDate = (daysAgo: number, hour: number, minute: number) => {
    const date = new Date()
    date.setDate(date.getDate() - daysAgo)
    date.setHours(hour, minute, 0, 0)

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()} ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00 +0000`
  }

  const defaultContent = `Subject: Re: Q1 Onboarding Workshop — agenda + next steps

--- Message 5 ---
From: Priya Shah <priya.shah@acmecorp.co.uk>
To: Andrei Rizea <andrei.rizea@neatly.io>
Cc: Tom Evans <tom.evans@acmecorp.co.uk>, Finance Team <finance@acmecorp.co.uk>
Date: ${getRelativeDate(2, 16, 18)}

Hi Andrei,

Thanks — that works. Let's lock in Friday at 5pm.

Can you send the revised agenda (with the security section) and a final quote by end of day tomorrow?
Also please include your company registration number on the invoice.

One more thing: we'll need the workshop recording, but only internally. Please confirm you won't use it for marketing.

Best,
Priya
Head of People Ops
Acme Corp


--- Message 4 ---
From: Andrei Rizea <andrei.rizea@neatly.io>
To: Priya Shah <priya.shah@acmecorp.co.uk>
Cc: Tom Evans <tom.evans@acmecorp.co.uk>
Date: ${getRelativeDate(2, 15, 47)}

Hi Priya,

Friday works for me. I can do 4pm or 5pm — whichever is best.
I'll update the agenda to include a short security section.

Re quote: do you want this billed to People Ops or Finance?

Thanks,
Andrei


--- Message 3 ---
From: Tom Evans <tom.evans@acmecorp.co.uk>
To: Andrei Rizea <andrei.rizea@neatly.io>
Cc: Priya Shah <priya.shah@acmecorp.co.uk>
Date: ${getRelativeDate(2, 12, 9)}

Hi Andrei,

Jumping in — we're aiming to finalise suppliers tomorrow.
If possible, can you send:
1) a revised agenda
2) a final quote (PO required)
3) confirmation you can support up to 40 attendees

Also, is the 90-minute format still feasible? We may need to shorten it.

Thanks,
Tom
Programme Manager, Acme Corp


--- Message 2 ---
From: Priya Shah <priya.shah@acmecorp.co.uk>
To: Andrei Rizea <andrei.rizea@neatly.io>
Date: ${getRelativeDate(3, 18, 32)}

Hi Andrei,

Great speaking earlier. Could we schedule the onboarding workshop for Friday afternoon?
We're based in London but one of our teams will join from New York.

Please share a draft agenda and an estimated cost.

Also, if you need to reach me quickly, my mobile is +44 7700 900123.

Best,
Priya


--- Message 1 ---
From: Andrei Rizea <andrei.rizea@neatly.io>
To: Priya Shah <priya.shah@acmecorp.co.uk>
Date: ${getRelativeDate(3, 16, 5)}

Hi Priya,

Thanks for your time today — here are a few options for the onboarding workshop:
- 60 mins: core workflow + Q&A
- 90 mins: workflow + hands-on exercise + Q&A

We can run it remote via Teams. If you'd like, we can record it.

Let me know what time on Friday works best.

Regards,
Andrei
Neatly Ltd`

  const [title, setTitle] = useState("Q1 Onboarding Workshop — agenda + next steps")
  const [content, setContent] = useState(defaultContent)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const [loadingStage, setLoadingStage] = useState(0)

  const loadingMessages = [
    "Analyzing email thread...",
    "Extracting stakeholders...",
    "Identifying action items...",
    "Finding deadlines...",
    "Drafting suggested replies...",
    "Finalizing analysis..."
  ]

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsAnalyzing(true)
    setError(null)
    setLoadingStage(0)

    // Cycle through loading messages
    const intervalId = setInterval(() => {
      setLoadingStage((prev) => (prev < loadingMessages.length - 1 ? prev + 1 : prev))
    }, 2000)

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          content,
          userId,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to analyze email thread")
      }

      const data = await response.json()
      if (data.redirectUrl) {
        router.push(data.redirectUrl)
      } else {
        router.push(`/analysis/${data.threadId}?source=analyze`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      setIsAnalyzing(false) // Stop analyzing on error
    } finally {
      clearInterval(intervalId) // Ensure interval is cleared
    }
  }

  return (
    <>
      {isAnalyzing && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="flex flex-col items-center max-w-sm w-full space-y-4 text-center animate-in fade-in zoom-in duration-300">
            <div className="relative h-16 w-16 mb-4">
              <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
              <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
              <Sparkles className="absolute inset-0 m-auto h-6 w-6 text-primary animate-pulse" />
            </div>
            <h3 className="text-xl font-semibold tracking-tight">{loadingMessages[loadingStage]}</h3>
            <p className="text-sm text-muted-foreground">This usually takes about 10-15 seconds.</p>
          </div>
        </div>
      )}

      <Card className="h-full flex flex-col relative">
        <CardHeader>
          <CardTitle>Email Thread Details</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <form onSubmit={handleAnalyze} className="space-y-6 flex-1 flex flex-col min-h-0">
            <div className="space-y-2">
              <Label htmlFor="title">Thread Title</Label>
              <Input
                id="title"
                placeholder="e.g., Q4 Budget Planning Discussion"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                disabled={isAnalyzing}
              />
            </div>

            <div className="space-y-2 flex-1 flex flex-col min-h-0 overflow-hidden">
              <Label htmlFor="content">Email Thread Content</Label>
              <Textarea
                id="content"
                placeholder="Paste your entire email thread here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                disabled={isAnalyzing}
                className="font-mono text-sm flex-1 resize-none overflow-auto"
              />
              <p className="text-xs text-muted-foreground shrink-0">
                Include all emails in the thread with headers (From, To, Date, Subject) for best results.
              </p>
            </div>

            {error && (
              <div className="rounded-lg bg-destructive/10 p-3">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <Button type="submit" className="w-full shrink-0" disabled={isAnalyzing}>
              <Sparkles className="mr-2 h-4 w-4" />
              Analyze Thread
            </Button>
          </form>
        </CardContent>
      </Card>
    </>
  )
}
