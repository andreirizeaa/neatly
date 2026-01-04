"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Users,
  CheckCircle2,
  Calendar,
  FileText,
  MessageSquare,
  Mail,
  Copy,
  Check,
  Search,
  Loader2,
  Link as LinkIcon,
} from "lucide-react"
import type { EmailThread, Analysis, ResearchResult, Block, Source, Citation } from "@/lib/types"
import { useState, useEffect, useRef } from "react"
import Link from "next/link"

function CitationBadge({ citationId, sources }: { citationId: string; sources: Source[] }) {
  const source = sources.find((s) => s.id === citationId)
  if (!source) return null

  return (
    <sup className="ml-0.5 inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-primary/20 text-primary text-[8px] font-bold cursor-help hover:bg-primary hover:text-primary-foreground transition-colors">
      <a href={source.url} target="_blank" rel="noopener noreferrer" title={source.title}>
        {sources.indexOf(source) + 1}
      </a>
    </sup>
  )
}

function RenderBlock({ block, sources }: { block: Block; sources: Source[] }) {
  switch (block.type) {
    case "heading":
      const level = Math.min(6, (block.level || 1))
      return (
        <div
          className={
            level === 1 ? "text-lg font-bold mt-4" :
              level === 2 ? "text-base font-bold mt-3" :
                "text-sm font-semibold mt-2"
          }
        >
          {block.text}
          {block.citations?.map((c, i) => (
            <CitationBadge key={i} citationId={c.source_id} sources={sources} />
          ))}
        </div>
      )

    case "paragraph":
      return (
        <p className="text-sm text-muted-foreground leading-relaxed">
          {block.text}
          {block.citations?.map((c, i) => (
            <CitationBadge key={i} citationId={c.source_id} sources={sources} />
          ))}
        </p>
      )

    case "bullets":
      return (
        <ul className="list-disc pl-5 space-y-1.5">
          {block.items?.map((item, i) => (
            <li key={i} className="text-sm text-muted-foreground leading-relaxed">
              {item.text}
              {item.citations?.map((c, j) => (
                <CitationBadge key={j} citationId={c.source_id} sources={sources} />
              ))}
            </li>
          ))}
        </ul>
      )

    case "callout":
      const kindColors = {
        info: "bg-blue-50 border-blue-200 text-blue-700",
        warning: "bg-amber-50 border-amber-200 text-amber-700",
        risk: "bg-red-50 border-red-200 text-red-700",
        tip: "bg-green-50 border-green-200 text-green-700",
        note: "bg-slate-50 border-slate-200 text-slate-700",
      }
      return (
        <div className={`p-3 rounded-md border text-xs ${kindColors[block.callout_kind || "info"]}`}>
          <div className="flex gap-2">
            <span className="font-bold uppercase text-[10px] mt-0.5">{block.callout_kind}</span>
            <p className="flex-1">
              {block.text}
              {block.citations?.map((c, i) => (
                <CitationBadge key={i} citationId={c.source_id} sources={sources} />
              ))}
            </p>
          </div>
        </div>
      )

    case "table":
      if (!block.table) return null
      return (
        <div className="overflow-x-auto border rounded-md my-2">
          {block.table.caption && (
            <caption className="text-[10px] text-muted-foreground p-2 caption-top text-left italic">
              {block.table.caption}
            </caption>
          )}
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-muted/50 border-b">
                {block.table.columns.map((col) => (
                  <th key={col.key} className="px-3 py-2 font-semibold">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.table.rows.map((row, rIdx) => (
                <tr key={rIdx} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="px-3 py-2">
                      <div className="flex items-center gap-1">
                        {String(cell.value)}
                        {cell.citations?.map((c, i) => (
                          <CitationBadge key={i} citationId={c.source_id} sources={sources} />
                        ))}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )

    case "definition_list":
      return (
        <dl className="space-y-3">
          {block.definitions?.map((def, i) => (
            <div key={i} className="space-y-1">
              <dt className="text-xs font-bold text-foreground">
                {def.term}
                {def.citations?.map((c, j) => (
                  <CitationBadge key={j} citationId={c.source_id} sources={sources} />
                ))}
              </dt>
              <dd className="text-sm text-muted-foreground pl-4 border-l-2 border-muted">{def.definition}</dd>
            </div>
          ))}
        </dl>
      )

    case "qa_list":
      return (
        <div className="space-y-4">
          {block.questions?.map((qa, i) => (
            <div key={i} className="bg-muted/30 rounded-lg p-3 space-y-2">
              <p className="text-sm font-semibold flex gap-2">
                <span className="text-primary font-black">Q:</span>
                {qa.q}
              </p>
              <p className="text-sm text-muted-foreground flex gap-2">
                <span className="text-muted-foreground font-black">A:</span>
                {qa.a}
                {qa.citations?.map((c, j) => (
                  <CitationBadge key={j} citationId={c.source_id} sources={sources} />
                ))}
              </p>
            </div>
          ))}
        </div>
      )

    case "divider":
      return <Separator className="my-4" />

    default:
      return null
  }
}

interface AnalysisViewProps {
  thread: EmailThread
  analysis: Analysis
}

import { ExitResearchDialog } from "./exit-research-dialog"
import { useRouter } from "next/navigation"

export function AnalysisView({ thread, analysis }: AnalysisViewProps) {
  const router = useRouter()
  const [copiedReply, setCopiedReply] = useState(false)
  const [research, setResearch] = useState<ResearchResult[]>(analysis.research || [])
  const [isIdentifyingTopics, setIsIdentifyingTopics] = useState(!analysis.research || analysis.research.length === 0)
  const [isResearchInProgress, setIsResearchInProgress] = useState(false)
  const [showExitDialog, setShowExitDialog] = useState(false)
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null)

  // Track research progress to prevent navigation
  useEffect(() => {
    // If we're identifying topics OR any topic is currently loading
    const anyLoading = research.some(r => r.isLoading) || isIdentifyingTopics
    setIsResearchInProgress(anyLoading)

    // Browser navigation protection (reload/close tab)
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (anyLoading) {
        e.preventDefault()
        e.returnValue = "" // Chrome requires returnValue to be set
      }
    }

    if (anyLoading) {
      window.addEventListener("beforeunload", handleBeforeUnload)
    }

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [research, isIdentifyingTopics])

  const handleNavigationAttempt = (path: string) => {
    if (isResearchInProgress) {
      setPendingNavigation(path)
      setShowExitDialog(true)
    } else {
      router.push(path)
    }
  }

  const confirmExit = () => {
    setShowExitDialog(false)
    if (pendingNavigation) {
      router.push(pendingNavigation)
    }
  }

  const cancelExit = () => {
    setShowExitDialog(false)
    setPendingNavigation(null)
  }

  // Ref to prevent double-execution from React Strict Mode
  const hasStartedIdentifyRef = useRef(false)

  useEffect(() => {
    // If we already have research results, don't trigger the process again
    if (analysis.research && analysis.research.length > 0) {
      console.log("Using cached research results from database")
      setResearch(analysis.research)
      setIsIdentifyingTopics(false)
      return
    }

    // Prevent duplicate calls from React Strict Mode double-mounting
    if (hasStartedIdentifyRef.current) {
      return
    }
    hasStartedIdentifyRef.current = true

    const identifyTopics = async () => {
      try {
        // 1. Identify Topics
        const response = await fetch("/api/research/identify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            analysisId: analysis.id,
            emailContent: thread.content,
          }),
        })

        const data = await response.json()

        if (data.topics && data.topics.length > 0) {
          // Set all topics initially (all will show as loading)
          setResearch(data.topics)
          setIsIdentifyingTopics(false)

          // 2. Process each topic sequentially
          for (const topicItem of data.topics) {
            try {
              const researchResponse = await fetch("/api/research/process", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  analysisId: analysis.id,
                  topic: topicItem.topic,
                  topicId: topicItem.id, // Send the ID
                  context: "Email thread analysis",
                  emailContent: thread.content,
                }),
              })

              const researchData = await researchResponse.json()

              if (researchData.success && researchData.result) {
                // Update this specific topic with results
                setResearch((prev) =>
                  prev.map((item) =>
                    item.topic === topicItem.topic ? { ...researchData.result, isLoading: false } : item,
                  ),
                )
              } else {
                throw new Error("Research failed")
              }
            } catch (error) {
              console.error("Error processing topic:", topicItem.topic, error)
              // Mark as failed
              setResearch((prev) =>
                prev.map((item) =>
                  item.topic === topicItem.topic
                    ? {
                      ...item,
                      isLoading: false,
                      schema_version: "1.0.0",
                      title: item.topic || "Research Result",
                      tldr: ["Research could not be completed for this topic."],
                      sections: [],
                      sources: [],
                    }
                    : item,
                ),
              )
            }
          }
        } else {
          setIsIdentifyingTopics(false)
        }
      } catch (error) {
        console.error("Error identifying/processing research:", error)
        setIsIdentifyingTopics(false)
      }
    }

    identifyTopics()
  }, [thread.id, thread.content])

  const copyReply = async () => {
    if (analysis.suggested_reply) {
      await navigator.clipboard.writeText(analysis.suggested_reply)
      setCopiedReply(true)
      setTimeout(() => setCopiedReply(false), 2000)
    }
  }

  return (
    <div className="space-y-6">
      <ExitResearchDialog
        isOpen={showExitDialog}
        onConfirm={confirmExit}
        onCancel={cancelExit}
      />

      {/* Research Findings */}
      <Card className="border-primary/50 bg-primary/5">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            <CardTitle>Research Findings</CardTitle>
            {isIdentifyingTopics && (
              <Badge variant="outline" className="ml-auto">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Identifying topics...
                </div>
              </Badge>
            )}
          </div>
          <CardDescription>AI-powered research on topics mentioned in the thread</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isIdentifyingTopics ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center py-8">
                <div className="text-center space-y-3">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                  <p className="text-sm text-muted-foreground">Analyzing email thread for research topics...</p>
                  <p className="text-xs text-muted-foreground">This may take a few moments</p>
                </div>
              </div>
            </div>
          ) : research.length > 0 ? (
            research.map((researchItem, idx) => (
              <div key={idx} className="space-y-3">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-lg">{researchItem.topic}</h3>
                  {researchItem.isLoading ? (
                    <Badge variant="outline" className="shrink-0">
                      <div className="flex items-center gap-1.5">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Researching...
                      </div>
                    </Badge>
                  ) : (
                    <Badge variant="default" className="shrink-0">
                      Researched
                    </Badge>
                  )}
                </div>

                {researchItem.isLoading ? (
                  <div className="bg-background rounded-lg p-6 border">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Searching for information and generating summary...</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* TLDR */}
                    {researchItem.tldr && researchItem.tldr.length > 0 && (
                      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-2">TL;DR</h4>
                        <ul className="list-disc pl-5 space-y-1">
                          {researchItem.tldr.map((bullet, bulletIdx) => (
                            <li key={bulletIdx} className="text-sm leading-relaxed">
                              {bullet}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Sections */}
                    {researchItem.sections?.map((section) => (
                      <div key={section.id} className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] uppercase font-bold px-1.5 py-0">
                            {section.kind.replace(/_/g, " ")}
                          </Badge>
                          <h4 className="font-bold text-base text-foreground">{section.title}</h4>
                        </div>
                        {section.summary && (
                          <p className="text-sm text-muted-foreground italic pl-2 border-l-2 border-muted">
                            {section.summary}
                          </p>
                        )}
                        <div className="space-y-4 pl-2">
                          {section.blocks.map((block, blockIdx) => (
                            <RenderBlock key={blockIdx} block={block} sources={researchItem.sources} />
                          ))}
                        </div>
                      </div>
                    ))}

                    {/* Sources */}
                    {researchItem.sources && researchItem.sources.length > 0 && (
                      <div className="pt-4 border-t">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                          <LinkIcon className="h-3 w-3" />
                          Sources
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {researchItem.sources.map((source) => (
                            <a
                              key={source.id}
                              href={source.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex flex-col p-2 rounded border bg-muted/30 hover:bg-muted/50 transition-colors text-left"
                            >
                              <span className="text-xs font-medium line-clamp-1">{source.title}</span>
                              <span className="text-[10px] text-muted-foreground line-clamp-1">
                                {source.publisher || new URL(source.url).hostname}
                              </span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {idx < research.length - 1 && <Separator className="my-4" />}
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">No research topics identified in this thread</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Stakeholders */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <CardTitle>Stakeholders</CardTitle>
            </div>
            <CardDescription>People involved in this conversation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {analysis.stakeholders.length === 0 ? (
              <p className="text-sm text-muted-foreground">No stakeholders identified</p>
            ) : (
              analysis.stakeholders.map((stakeholder, idx) => (
                <div key={idx} className="border-l-2 border-primary pl-4 space-y-1">
                  <div className="font-semibold">{stakeholder.name}</div>
                  <div className="text-sm text-muted-foreground">{stakeholder.email}</div>
                  <Badge variant="secondary" className="text-xs">
                    {stakeholder.role}
                  </Badge>
                  <p className="text-xs text-muted-foreground italic mt-2">&quot;{stakeholder.evidence}&quot;</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Action Items */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <CardTitle>Action Items</CardTitle>
            </div>
            <CardDescription>Tasks identified from the thread</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {analysis.action_items.length === 0 ? (
              <p className="text-sm text-muted-foreground">No action items identified</p>
            ) : (
              analysis.action_items.map((item, idx) => (
                <div key={idx} className="border-l-2 border-primary pl-4 space-y-1">
                  <div className="font-medium">{item.description}</div>
                  <div className="text-sm text-muted-foreground">Assignee: {item.assignee}</div>
                  <Badge
                    variant={
                      item.priority === "high" ? "destructive" : item.priority === "medium" ? "default" : "secondary"
                    }
                    className="text-xs"
                  >
                    {item.priority} priority
                  </Badge>
                  <p className="text-xs text-muted-foreground italic mt-2">&quot;{item.evidence}&quot;</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Deadlines */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <CardTitle>Deadlines</CardTitle>
            </div>
            <CardDescription>Important dates and milestones</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {analysis.deadlines.length === 0 ? (
              <p className="text-sm text-muted-foreground">No deadlines identified</p>
            ) : (
              analysis.deadlines.map((deadline, idx) => (
                <div key={idx} className="border-l-2 border-primary pl-4 space-y-1">
                  <div className="font-semibold">{new Date(deadline.date).toLocaleDateString()}</div>
                  <div className="text-sm">{deadline.description}</div>
                  <p className="text-xs text-muted-foreground italic mt-2">&quot;{deadline.evidence}&quot;</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Key Decisions */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <CardTitle>Key Decisions</CardTitle>
            </div>
            <CardDescription>Important conclusions reached</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {analysis.key_decisions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No key decisions identified</p>
            ) : (
              analysis.key_decisions.map((decision, idx) => (
                <div key={idx} className="border-l-2 border-primary pl-4 space-y-1">
                  <div className="font-medium">{decision.decision}</div>
                  <div className="text-sm text-muted-foreground">{decision.rationale}</div>
                  <p className="text-xs text-muted-foreground italic mt-2">&quot;{decision.evidence}&quot;</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Open Questions */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            <CardTitle>Open Questions</CardTitle>
          </div>
          <CardDescription>Topics that need follow-up</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {analysis.open_questions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No open questions identified</p>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {analysis.open_questions.map((question, idx) => (
                <div key={idx} className="border-l-2 border-primary pl-4 space-y-1">
                  <div className="font-medium">{question.question}</div>
                  <div className="text-sm text-muted-foreground">{question.context}</div>
                  <p className="text-xs text-muted-foreground italic mt-2">&quot;{question.evidence}&quot;</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Suggested Reply */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              <CardTitle>Suggested Reply</CardTitle>
            </div>
            <Button variant="outline" size="sm" onClick={copyReply}>
              {copiedReply ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
              {copiedReply ? "Copied!" : "Copy"}
            </Button>
          </div>
          <CardDescription>A contextual response based on the thread analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm whitespace-pre-wrap leading-relaxed">{analysis.suggested_reply}</p>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Original Thread */}
      <Card>
        <CardHeader>
          <CardTitle>Original Email Thread</CardTitle>
          <CardDescription>The raw content that was analyzed</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm font-mono whitespace-pre-wrap leading-relaxed">{thread.content}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
