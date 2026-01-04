"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import {
    Users,
    CheckCircle2,
    Calendar,
    FileText,
    Mail,
    Copy,
    Check,
    Search,
    Loader2,
    ChevronRight,
    AlertCircle,
    ArrowUpRight,
    RefreshCw,
} from "lucide-react"
import type { EmailThread, Analysis, ResearchResult } from "@/lib/types"
import { useState, useEffect, useRef } from "react"
import { ExitResearchDialog } from "./exit-research-dialog"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface AnalysisDashboardProps {
    thread: EmailThread
    analysis: Analysis
}

export function AnalysisDashboard({ thread, analysis }: AnalysisDashboardProps) {
    const router = useRouter()
    const [copiedReply, setCopiedReply] = useState(false)
    const [research, setResearch] = useState<ResearchResult[]>(analysis.research || [])
    const [isIdentifyingTopics, setIsIdentifyingTopics] = useState(!analysis.research || analysis.research.length === 0)
    const [isResearchInProgress, setIsResearchInProgress] = useState(false)
    const [showExitDialog, setShowExitDialog] = useState(false)
    const [pendingNavigation, setPendingNavigation] = useState<string | null>(null)

    // Dialog states
    const [showStakeholdersDialog, setShowStakeholdersDialog] = useState(false)
    const [showActionItemsDialog, setShowActionItemsDialog] = useState(false)
    const [showDeadlinesDialog, setShowDeadlinesDialog] = useState(false)
    const [showQuestionsDialog, setShowQuestionsDialog] = useState(false)
    const [showOriginalThreadDialog, setShowOriginalThreadDialog] = useState(false)
    const [showSuggestedReplyDialog, setShowSuggestedReplyDialog] = useState(false)

    // Determine which replies to show
    const hasMultipleReplies = analysis.suggested_replies && analysis.suggested_replies.length > 0
    const replies = hasMultipleReplies
        ? analysis.suggested_replies!
        : analysis.suggested_reply
            ? [{ title: "Suggested Reply", content: analysis.suggested_reply }]
            : []

    // Track research progress but do NOT block navigation
    useEffect(() => {
        const anyLoading = research.some(r => r.isLoading) || isIdentifyingTopics
        setIsResearchInProgress(anyLoading)

        // Only warn on actual page unload/refresh, not client-side navigation
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (anyLoading) {
                e.preventDefault()
                e.returnValue = ""
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
        // Allow navigation even if research is in progress
        router.push(path)
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
        // If we have full research data passed in props, use it
        if (analysis.research && analysis.research.length > 0) {
            // Check if any items are still loading in the props data (unlikely from server, but possible)
            const hasLoading = analysis.research.some(r => r.isLoading)
            setResearch(analysis.research)
            setIsIdentifyingTopics(false)

            if (!hasLoading) return
        }

        // Prevent duplicate calls from React Strict Mode double-mounting
        if (hasStartedIdentifyRef.current) {
            return
        }
        hasStartedIdentifyRef.current = true

        const identifyTopics = async () => {
            try {
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
                    setResearch(data.topics)
                    setIsIdentifyingTopics(false)

                    // Only process topics that are marked as loading
                    for (const topicItem of data.topics) {
                        if (!topicItem.isLoading) continue

                        try {
                            const researchResponse = await fetch("/api/research/process", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                    analysisId: analysis.id,
                                    topic: topicItem.topic,
                                    topicId: topicItem.id,
                                    context: "Email thread analysis",
                                    emailContent: thread.content,
                                }),
                            })

                            const researchData = await researchResponse.json()

                            if (researchData.success && researchData.result) {
                                setResearch((prev) =>
                                    prev.map((item) =>
                                        item.topic === topicItem.topic ? { ...item, ...researchData.result, isLoading: false } : item,
                                    ),
                                )
                            } else {
                                throw new Error("Research failed")
                            }
                        } catch (error) {
                            console.error("Error processing topic:", topicItem.topic, error)
                            setResearch((prev) =>
                                prev.map((item) =>
                                    item.topic === topicItem.topic
                                        ? {
                                            ...item,
                                            isLoading: false,
                                            schema_version: "1.0.0",
                                            title: item.topic || "Research Result",
                                            tldr: ["Research could not be completed for this topic."],
                                            sections: [{ id: "error", kind: "custom", title: "Error", summary: "Failed", blocks: [] }],
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

    const copyReply = async (content: string) => {
        await navigator.clipboard.writeText(content)
        setCopiedReply(true)
        setTimeout(() => setCopiedReply(false), 2000)
    }

    // Derive stats for enriched cards
    const highPriorityActions = analysis.action_items.filter(a => a.priority === "high").length
    const nextDeadline = analysis.deadlines
        .map(d => new Date(d.date))
        .sort((a, b) => a.getTime() - b.getTime())[0]
    const keyDecisionsCount = analysis.key_decisions?.length || 0

    return (
        <div className="flex flex-col h-full relative">
            <ExitResearchDialog
                isOpen={showExitDialog}
                onConfirm={confirmExit}
                onCancel={cancelExit}
            />

            {/* Stakeholders Dialog */}
            <Dialog open={showStakeholdersDialog} onOpenChange={setShowStakeholdersDialog}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
                    <DialogHeader>
                        <DialogTitle>Stakeholders</DialogTitle>
                        <DialogDescription>People involved in this conversation</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                        {analysis.stakeholders.map((stakeholder, idx) => (
                            <div key={idx} className="border-l-2 border-primary pl-4 space-y-1">
                                <div className="font-semibold">{stakeholder.name}</div>
                                <div className="text-sm text-muted-foreground">{stakeholder.email}</div>
                                <Badge variant="secondary" className="text-xs">
                                    {stakeholder.role}
                                </Badge>
                                <p className="text-xs text-muted-foreground italic mt-2">&quot;{stakeholder.evidence}&quot;</p>
                            </div>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Action Items Dialog */}
            <Dialog open={showActionItemsDialog} onOpenChange={setShowActionItemsDialog}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
                    <DialogHeader>
                        <DialogTitle>Action Items</DialogTitle>
                        <DialogDescription>Tasks identified from the thread</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                        {analysis.action_items.map((item, idx) => (
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
                        ))}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Deadlines Dialog */}
            <Dialog open={showDeadlinesDialog} onOpenChange={setShowDeadlinesDialog}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
                    <DialogHeader>
                        <DialogTitle>Deadlines</DialogTitle>
                        <DialogDescription>Important dates and milestones</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                        {analysis.deadlines.map((deadline, idx) => (
                            <div key={idx} className="border-l-2 border-primary pl-4 space-y-1">
                                <div className="font-semibold">{new Date(deadline.date).toLocaleDateString()}</div>
                                <div className="text-sm">{deadline.description}</div>
                                <p className="text-xs text-muted-foreground italic mt-2">&quot;{deadline.evidence}&quot;</p>
                            </div>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Open Questions Dialog */}
            <Dialog open={showQuestionsDialog} onOpenChange={setShowQuestionsDialog}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
                    <DialogHeader>
                        <DialogTitle>Open Questions</DialogTitle>
                        <DialogDescription>Topics that need follow-up</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                        {analysis.open_questions.map((question, idx) => (
                            <div key={idx} className="border-l-2 border-primary pl-4 space-y-1">
                                <div className="font-medium">{question.question}</div>
                                <div className="text-sm text-muted-foreground">{question.context}</div>
                                <p className="text-xs text-muted-foreground italic mt-2">&quot;{question.evidence}&quot;</p>
                            </div>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>
            {/* Original Thread Dialog */}
            <Dialog open={showOriginalThreadDialog} onOpenChange={setShowOriginalThreadDialog}>
                <DialogContent className="max-w-[60vw] sm:max-w-[60vw] w-full max-h-[85vh] flex flex-col h-[85vh]">
                    <DialogHeader className="pb-4">
                        <DialogTitle>Original Thread</DialogTitle>
                        <DialogDescription>Full content of the analyzed conversation</DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 overflow-hidden pt-4 flex flex-col min-h-0 space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="thread-title">Thread Title</Label>
                            <Input
                                id="thread-title"
                                value={thread.title}
                                readOnly
                                className="bg-muted font-medium"
                            />
                        </div>
                        <div className="space-y-2 flex-1 flex flex-col min-h-0">
                            <Label htmlFor="thread-content">Email Thread Content</Label>
                            <Textarea
                                id="thread-content"
                                value={thread.content}
                                readOnly
                                className="flex-1 resize-none font-mono text-sm bg-muted leading-relaxed p-4"
                            />
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Suggested Reply Dialog */}
            <Dialog open={showSuggestedReplyDialog} onOpenChange={setShowSuggestedReplyDialog}>
                <DialogContent className="max-w-[60vw] sm:max-w-[60vw] w-full max-h-[85vh] flex flex-col h-[85vh]">
                    <DialogHeader className="pb-4">
                        <DialogTitle>{hasMultipleReplies ? "Suggested Replies" : "Suggested Reply"}</DialogTitle>
                        <DialogDescription>
                            {hasMultipleReplies ? "Choose from distinct draft options" : "Draft response based on the analysis"}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 overflow-hidden pt-4 flex flex-col min-h-0">
                        {hasMultipleReplies ? (
                            <div className="border rounded-md overflow-hidden">
                                <Accordion type="single" collapsible className="w-full">
                                    {replies.map((reply, index) => (
                                        <AccordionItem key={index} value={`item-${index}`} className="border-b last:border-none">
                                            <AccordionTrigger className="text-sm font-semibold px-4 hover:no-underline hover:bg-muted/50 transition-colors">
                                                {reply.title}
                                            </AccordionTrigger>
                                            <AccordionContent>
                                                <div className="flex flex-col space-y-4 p-4">
                                                    <Textarea
                                                        value={reply.content}
                                                        readOnly
                                                        className="min-h-[300px] resize-none font-mono text-sm bg-background leading-relaxed p-4"
                                                    />
                                                    <div className="flex justify-end">
                                                        <Button onClick={() => copyReply(reply.content)} className="gap-2" size="sm">
                                                            {copiedReply ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                                            {copiedReply ? "Copied" : "Copy to Clipboard"}
                                                        </Button>
                                                    </div>
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>
                                    ))}
                                </Accordion>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col min-h-0 space-y-4">
                                <Textarea
                                    value={replies[0]?.content || ""}
                                    readOnly
                                    className="flex-1 resize-none font-mono text-sm bg-muted leading-relaxed p-4"
                                />
                                <div className="flex justify-end pt-2">
                                    <Button onClick={() => copyReply(replies[0]?.content || "")} className="gap-2">
                                        {copiedReply ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                        {copiedReply ? "Copied" : "Copy to Clipboard"}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <div className="flex-1 min-h-0 grid grid-cols-2 gap-4 overflow-hidden mb-4">
                {/* Left Column - Research Topics */}
                <div className="flex flex-col h-full overflow-hidden">
                    <Card className="flex flex-col h-full">
                        <CardHeader className="border-b">
                            <CardTitle className="text-base text-center w-full -mt-2 -mb-[20px]">Research Topics</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-auto p-0 scrollbar-thin scrollbar-thumb-muted-foreground/20">
                            {isIdentifyingTopics ? (
                                <div className="flex items-center justify-center py-8">
                                    <div className="text-center space-y-2">
                                        <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
                                        <p className="text-xs text-muted-foreground">Analyzing...</p>
                                    </div>
                                </div>
                            ) : research.length > 0 ? (
                                <div className="divide-y text-left">
                                    {research.map((item) => {
                                        const isError = item.sections?.some(s => s.id === "error")
                                        const isNavigable = !item.isLoading && item.id && !isError

                                        const content = (
                                            <>
                                                <div className="flex-1 min-w-0 pr-4">
                                                    <div className="flex items-center gap-2">
                                                        <p className={`font-medium transition-colors ${isError ? "text-destructive" : "text-foreground group-hover:text-primary"
                                                            }`}>
                                                            {item.topic}
                                                        </p>
                                                        {isError && (
                                                            <Badge variant="destructive" className="h-4 px-1 text-[10px] uppercase">Failed</Badge>
                                                        )}
                                                    </div>
                                                    {isError && item.tldr && item.tldr.length > 0 && !item.isLoading && (
                                                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                                                            {item.tldr[0]}
                                                        </p>
                                                    )}
                                                </div>
                                                {item.isLoading ? (
                                                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />
                                                ) : isError ? (
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                                                        disabled={isResearchInProgress}
                                                        onClick={async (e) => {
                                                            e.stopPropagation()
                                                            e.preventDefault()
                                                            // Retry logic
                                                            setResearch(prev => prev.map(p =>
                                                                p.topic === item.topic ? { ...p, isLoading: true } : p
                                                            ))

                                                            try {
                                                                const researchResponse = await fetch("/api/research/process", {
                                                                    method: "POST",
                                                                    headers: { "Content-Type": "application/json" },
                                                                    body: JSON.stringify({
                                                                        analysisId: analysis.id,
                                                                        topic: item.topic,
                                                                        topicId: item.id,
                                                                        context: "Email thread analysis",
                                                                        emailContent: thread.content,
                                                                    }),
                                                                })

                                                                const researchData = await researchResponse.json()

                                                                if (researchData.success && researchData.result) {
                                                                    setResearch((prev) =>
                                                                        prev.map((prevItem) =>
                                                                            prevItem.topic === item.topic ? { ...prevItem, ...researchData.result, isLoading: false } : prevItem,
                                                                        ),
                                                                    )
                                                                } else {
                                                                    throw new Error("Retry failed")
                                                                }
                                                            } catch (error) {
                                                                console.error("Retry error:", error)
                                                                setResearch(prev => prev.map(p =>
                                                                    p.topic === item.topic ? {
                                                                        ...p,
                                                                        isLoading: false,
                                                                        sections: [{ id: "error", kind: "custom", title: "Error", summary: "Failed", blocks: [] }]
                                                                    } : p
                                                                ))
                                                            }
                                                        }}
                                                    >
                                                        <RefreshCw className="h-4 w-4" />
                                                        <span className="sr-only">Retry</span>
                                                    </Button>
                                                ) : (
                                                    <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary transition-colors shrink-0" />
                                                )}
                                            </>
                                        )

                                        if (isNavigable) {
                                            return (
                                                <Link
                                                    key={item.id || item.topic}
                                                    href={`/analysis/${thread.id}/topic/${item.id}`}
                                                    className="flex items-center justify-between p-4 transition-colors text-sm hover:bg-muted/50 cursor-pointer group"
                                                >
                                                    {content}
                                                </Link>
                                            )
                                        }

                                        return (
                                            <div
                                                key={item.id || item.topic}
                                                className={`flex items-center justify-between p-4 transition-colors text-sm ${item.isLoading
                                                    ? "bg-muted/30 cursor-wait"
                                                    : "hover:bg-muted/50 cursor-default"
                                                    }`}
                                            >
                                                {content}
                                            </div>
                                        )
                                    })}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8 text-center">
                                    <Search className="h-8 w-8 mb-2 opacity-20" />
                                    <p className="text-sm">No research topics identified</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column - Summary & Reply */}
                <div className="flex flex-col h-full gap-3 overflow-hidden">
                    {/* Summary Grid */}
                    <div className="grid grid-cols-2 grid-rows-2 gap-3 flex-[4] min-h-0 overflow-hidden">
                        {/* Stakeholders Card */}
                        <Card
                            className="cursor-pointer hover:bg-muted/50 transition-all border shadow-sm group overflow-hidden"
                            onClick={() => analysis.stakeholders.length > 0 && setShowStakeholdersDialog(true)}
                        >
                            <CardContent className="p-4 flex flex-col h-full justify-between overflow-auto scrollbar-thin scrollbar-thumb-muted-foreground/20">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                                        <Users className="h-4 w-4 text-primary" />
                                    </div>
                                    {analysis.stakeholders.length > 0 && (
                                        <ArrowUpRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-foreground transition-colors" />
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <p className="text-2xl font-bold tracking-tight">{analysis.stakeholders.length}</p>
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Stakeholders</p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Action Items Card */}
                        <Card
                            className="cursor-pointer hover:bg-muted/50 transition-all border shadow-sm group overflow-hidden"
                            onClick={() => analysis.action_items.length > 0 && setShowActionItemsDialog(true)}
                        >
                            <CardContent className="p-4 flex flex-col h-full justify-between overflow-auto scrollbar-thin scrollbar-thumb-muted-foreground/20">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                                        <CheckCircle2 className="h-4 w-4 text-primary" />
                                    </div>
                                    {analysis.action_items.length > 0 && (
                                        <ArrowUpRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-foreground transition-colors" />
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <p className="text-2xl font-bold tracking-tight">{analysis.action_items.length}</p>
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Action Items</p>
                                        {highPriorityActions > 0 && (
                                            <Badge variant="destructive" className="h-5 px-1.5 text-[10px] uppercase font-bold">
                                                {highPriorityActions} High Priority
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Deadlines Card */}
                        <Card
                            className="cursor-pointer hover:bg-muted/50 transition-all border shadow-sm group overflow-hidden"
                            onClick={() => analysis.deadlines.length > 0 && setShowDeadlinesDialog(true)}
                        >
                            <CardContent className="p-4 flex flex-col h-full justify-between overflow-auto scrollbar-thin scrollbar-thumb-muted-foreground/20">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                                        <Calendar className="h-4 w-4 text-primary" />
                                    </div>
                                    {analysis.deadlines.length > 0 && (
                                        <ArrowUpRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-foreground transition-colors" />
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <p className="text-2xl font-bold tracking-tight">{analysis.deadlines.length}</p>
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Deadlines</p>
                                        {nextDeadline && (
                                            <span className="text-[10px] text-muted-foreground font-medium bg-muted px-1.5 py-0.5 rounded">
                                                Next: {nextDeadline.toLocaleDateString("en-GB", { month: 'short', day: 'numeric' })}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Questions Card */}
                        <Card
                            className="cursor-pointer hover:bg-muted/50 transition-all border shadow-sm group overflow-hidden"
                            onClick={() => analysis.open_questions.length > 0 && setShowQuestionsDialog(true)}
                        >
                            <CardContent className="p-4 flex flex-col h-full justify-between overflow-auto scrollbar-thin scrollbar-thumb-muted-foreground/20">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                                        <AlertCircle className="h-4 w-4 text-primary" />
                                    </div>
                                    {analysis.open_questions.length > 0 && (
                                        <ArrowUpRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-foreground transition-colors" />
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <p className="text-2xl font-bold tracking-tight">{analysis.open_questions.length}</p>
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Questions</p>
                                        {keyDecisionsCount > 0 && (
                                            <Badge variant="outline" className="h-5 px-1.5 text-[10px] uppercase font-bold border-muted-foreground/20">
                                                {keyDecisionsCount} Decisions
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Suggested Reply Card */}
                    <Card
                        className="cursor-pointer hover:bg-muted/50 transition-all border shadow-sm group flex-1 min-h-0"
                        onClick={() => setShowSuggestedReplyDialog(true)}
                    >
                        <CardContent className="p-4 flex flex-col h-full justify-between overflow-auto scrollbar-thin scrollbar-thumb-muted-foreground/20">
                            <div className="flex justify-between items-start mb-2">
                                <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                                    <Mail className="h-4 w-4 text-primary" />
                                </div>
                                <ArrowUpRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-foreground transition-colors" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-2xl font-bold tracking-tight">
                                    {hasMultipleReplies ? replies.length : "Draft"}
                                </p>
                                <div className="flex items-center justify-between">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                        {hasMultipleReplies ? "Suggested Replies" : "Suggested Reply"}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Full Width Original Thread Bar */}
            <div className="flex-none bg-background">
                <div
                    className="w-full bg-card hover:bg-muted/50 border rounded-lg shadow-sm transition-all cursor-pointer group py-3 px-4 flex items-center justify-between"
                    onClick={() => setShowOriginalThreadDialog(true)}
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                            <FileText className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-semibold group-hover:text-primary transition-colors">Original Email Thread</span>
                            <span className="text-xs text-muted-foreground hidden sm:inline-block">View the full conversation context</span>
                        </div>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-foreground transition-colors" />
                </div>
            </div>
        </div >
    )
}
