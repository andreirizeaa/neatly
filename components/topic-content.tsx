"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Link as LinkIcon } from "lucide-react"
import type { ResearchResult, Block, Source } from "@/lib/types"

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
                    {cleanText(block.text)}
                    {block.citations?.map((c, i) => (
                        <CitationBadge key={i} citationId={c.source_id} sources={sources} />
                    ))}
                </div>
            )

        case "paragraph":
            return (
                <p className="text-sm text-muted-foreground leading-relaxed">
                    {cleanText(block.text)}
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
                            {cleanText(item.text)}
                            {item.citations?.map((c, j) => (
                                <CitationBadge key={j} citationId={c.source_id} sources={sources} />
                            ))}
                        </li>
                    ))}
                </ul>
            )

        case "callout":
            const kindColors = {
                info: "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/50 dark:border-blue-800 dark:text-blue-300",
                warning: "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/50 dark:border-amber-800 dark:text-amber-300",
                risk: "bg-red-50 border-red-200 text-red-700 dark:bg-red-950/50 dark:border-red-800 dark:text-red-300",
                tip: "bg-green-50 border-green-200 text-green-700 dark:bg-green-950/50 dark:border-green-800 dark:text-green-300",
                note: "bg-slate-50 border-slate-200 text-slate-700 dark:bg-slate-950/50 dark:border-slate-800 dark:text-slate-300",
            }
            return (
                <div className={`p-3 rounded-md border text-xs ${kindColors[block.callout_kind || "info"]}`}>
                    <div className="flex gap-2">
                        <span className="font-bold uppercase text-[10px] mt-0.5">{block.callout_kind}</span>
                        <p className="flex-1">
                            {cleanText(block.text)}
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
                            {cleanText(block.table.caption)}
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
                                {cleanText(def.term)}
                                {def.citations?.map((c, j) => (
                                    <CitationBadge key={j} citationId={c.source_id} sources={sources} />
                                ))}
                            </dt>
                            <dd className="text-sm text-muted-foreground pl-4 border-l-2 border-muted">{cleanText(def.definition)}</dd>
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
                                {cleanText(qa.q)}
                            </p>
                            <p className="text-sm text-muted-foreground flex gap-2">
                                <span className="text-muted-foreground font-black">A:</span>
                                {cleanText(qa.a)}
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

interface TopicContentProps {
    researchItem: ResearchResult
}

// Helper to clean text (remove trailing slashes, trims)
function cleanText(text?: string | null): string {
    if (!text) return ""
    // Remove leading/trailing slashes and whitespace
    return text.replace(/^[\/\s]+|[\/\s]+$/g, "").trim()
}

// Helper to check if a block has meaningful content
function hasBlockContent(block: Block): boolean {
    const text = cleanText(block.text)

    switch (block.type) {
        case "heading":
        case "paragraph":
        case "callout":
            return text.length > 0

        case "bullets":
            return (block.items?.filter(i => cleanText(i.text).length > 0).length ?? 0) > 0

        case "table":
            return (block.table?.rows.length ?? 0) > 0

        case "definition_list":
            return (block.definitions?.filter(d => cleanText(d.term).length > 0).length ?? 0) > 0

        case "qa_list":
            return (block.questions?.filter(q => cleanText(q.q).length > 0).length ?? 0) > 0

        case "divider":
            return true

        default:
            return false
    }
}

export function TopicContent({ researchItem }: TopicContentProps) {
    const sources = researchItem.sources || []

    return (
        <div className="space-y-6">
            {/* TLDR - Outside the card */}
            {researchItem.tldr && researchItem.tldr.filter(t => cleanText(t).length > 0).length > 0 && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-2">TL;DR</h4>
                    <ul className="list-disc pl-5 space-y-1">
                        {researchItem.tldr
                            .map(t => cleanText(t))
                            .filter(t => t.length > 0)
                            .map((bullet, bulletIdx) => (
                                <li key={bulletIdx} className="text-sm leading-relaxed">
                                    {bullet}
                                </li>
                            ))}
                    </ul>
                </div>
            )}

            <Card>
                <CardContent className="p-4 pt-0 pb-0 space-y-4">
                    {/* Sections */}
                    {researchItem.sections
                        ?.filter(section => {
                            // Only show section if it has at least one block with content
                            return section.blocks.some(hasBlockContent)
                        })
                        .map((section) => (
                            <div key={section.id} className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-[10px] uppercase font-bold px-1.5 py-0">
                                        {section.kind.replace(/_/g, " ")}
                                    </Badge>
                                </div>
                                {cleanText(section.summary) && (
                                    <p className="text-sm text-muted-foreground italic pl-2 border-l-2 border-muted">
                                        {cleanText(section.summary)}
                                    </p>
                                )}
                                <div className="space-y-4 pl-2">
                                    {section.blocks
                                        .filter(hasBlockContent)
                                        .map((block, blockIdx) => (
                                            <RenderBlock key={blockIdx} block={block} sources={sources} />
                                        ))}
                                </div>
                            </div>
                        ))}

                    {/* Sources */}
                    {sources.length > 0 && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-[10px] uppercase font-bold px-1.5 py-0">
                                    Sources
                                </Badge>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-2">
                                {sources.map((source) => (
                                    <a
                                        key={source.id}
                                        href={source.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex flex-col p-2 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors text-left"
                                    >
                                        <span className="text-xs font-medium line-clamp-1">{cleanText(source.title) || source.url}</span>
                                        <span className="text-[10px] text-muted-foreground line-clamp-1">
                                            {cleanText(source.publisher) || new URL(source.url).hostname}
                                        </span>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
