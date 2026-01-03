"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Mail, Eye, Trash2, FileText } from "lucide-react"
import Link from "next/link"
import type { EmailThread } from "@/lib/types"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

interface HistoryListProps {
  threads: EmailThread[]
}

export function HistoryList({ threads: initialThreads }: HistoryListProps) {
  const [threads, setThreads] = useState(initialThreads)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const router = useRouter()

  const handleDelete = async (threadId: string) => {
    if (!confirm("Are you sure you want to delete this analysis? This action cannot be undone.")) {
      return
    }

    setDeletingId(threadId)
    const supabase = createClient()

    try {
      const { error } = await supabase.from("email_threads").delete().eq("id", threadId)

      if (error) throw error

      setThreads(threads.filter((t) => t.id !== threadId))
    } catch (error) {
      console.error("Error deleting thread:", error)
      alert("Failed to delete thread")
    } finally {
      setDeletingId(null)
    }
  }

  if (threads.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="rounded-full bg-muted p-4 mb-4">
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No analyses yet</h3>
          <p className="text-muted-foreground text-center mb-6">
            Start by analyzing your first email thread to see it appear here.
          </p>
          <Link href="/upload">
            <Button>
              <Mail className="mr-2 h-4 w-4" />
              Analyze Email Thread
            </Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {threads.map((thread) => (
        <Card key={thread.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-xl mb-2">{thread.title}</CardTitle>
                <CardDescription className="flex items-center gap-2 flex-wrap">
                  <span>Created {new Date(thread.created_at).toLocaleDateString()}</span>
                  <span>•</span>
                  <span>{new Date(thread.created_at).toLocaleTimeString()}</span>
                </CardDescription>
              </div>
              <Badge variant="secondary">Analyzed</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Link href={`/analysis/${thread.id}`} className="flex-1">
                <Button variant="default" className="w-full">
                  <Eye className="mr-2 h-4 w-4" />
                  View Analysis
                </Button>
              </Link>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleDelete(thread.id)}
                disabled={deletingId === thread.id}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
