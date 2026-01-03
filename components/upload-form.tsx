"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Sparkles } from "lucide-react"

interface UploadFormProps {
  userId: string
}

export function UploadForm({ userId }: UploadFormProps) {
  const [title, setTitle] = useState("Q1 Onboarding Workshop — agenda + next steps")
  const [content, setContent] = useState(`Subject: Re: Q1 Onboarding Workshop — agenda + next steps

--- Message 5 ---
From: Priya Shah <priya.shah@acmecorp.co.uk>
To: Andrei Rizea <andrei.rizea@neatly.io>
Cc: Tom Evans <tom.evans@acmecorp.co.uk>, Finance Team <finance@acmecorp.co.uk>
Date: Thu, 2 Jan 2026 16:18:11 +0000

Hi Andrei,

Thanks — that works. Let’s lock in Friday at 5pm.

Can you send the revised agenda (with the security section) and a final quote by end of day tomorrow?
Also please include your company registration number on the invoice.

One more thing: we’ll need the workshop recording, but only internally. Please confirm you won’t use it for marketing.

Best,
Priya
Head of People Ops
Acme Corp


--- Message 4 ---
From: Andrei Rizea <andrei.rizea@neatly.io>
To: Priya Shah <priya.shah@acmecorp.co.uk>
Cc: Tom Evans <tom.evans@acmecorp.co.uk>
Date: Thu, 2 Jan 2026 15:47:03 +0000

Hi Priya,

Friday works for me. I can do 4pm or 5pm — whichever is best.
I’ll update the agenda to include a short security section.

Re quote: do you want this billed to People Ops or Finance?

Thanks,
Andrei


--- Message 3 ---
From: Tom Evans <tom.evans@acmecorp.co.uk>
To: Andrei Rizea <andrei.rizea@neatly.io>
Cc: Priya Shah <priya.shah@acmecorp.co.uk>
Date: Thu, 2 Jan 2026 12:09:44 +0000

Hi Andrei,

Jumping in — we’re aiming to finalise suppliers tomorrow.
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
Date: Wed, 1 Jan 2026 18:32:01 +0000

Hi Andrei,

Great speaking earlier. Could we schedule the onboarding workshop for Friday afternoon?
We’re based in London but one of our teams will join from New York.

Please share a draft agenda and an estimated cost.

Also, if you need to reach me quickly, my mobile is +44 7700 900123.

Best,
Priya


--- Message 1 ---
From: Andrei Rizea <andrei.rizea@neatly.io>
To: Priya Shah <priya.shah@acmecorp.co.uk>
Date: Wed, 1 Jan 2026 16:05:12 +0000

Hi Priya,

Thanks for your time today — here are a few options for the onboarding workshop:
- 60 mins: core workflow + Q&A
- 90 mins: workflow + hands-on exercise + Q&A

We can run it remote via Teams. If you’d like, we can record it.

Let me know what time on Friday works best.

Regards,
Andrei
Neatly Ltd`)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsAnalyzing(true)
    setError(null)

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
      router.push(`/analysis/${data.threadId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Email Thread Details</CardTitle>
        <CardDescription>Provide a title and paste the email conversation you want to analyze</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleAnalyze} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Thread Title</Label>
            <Input
              id="title"
              placeholder="e.g., Q4 Budget Planning Discussion"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Email Thread Content</Label>
            <Textarea
              id="content"
              placeholder="Paste your entire email thread here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              rows={12}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Include all emails in the thread with headers (From, To, Date, Subject) for best results.
            </p>
          </div>

          {error && (
            <div className="rounded-lg bg-destructive/10 p-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isAnalyzing}>
            {isAnalyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing Thread...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Analyze Thread
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
